package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
	}))

	k8scfg, err := rest.InClusterConfig()
	if err != nil {
		logger.Error("error loading kubernetes configuration", slog.Any("error", err))
		os.Exit(1)
	}
	k8sClient, err := kubernetes.NewForConfig(k8scfg)
	if err != nil {
		logger.Error("error creating kubernetes client", slog.Any("error", err))
		os.Exit(1)
	}

	ctx := context.Background()

	// Find all secrets with the cnpg.io/userType=superuser label
	secrets, err := k8sClient.CoreV1().Secrets("").List(ctx, metav1.ListOptions{
		LabelSelector: "cnpg.io/userType=superuser",
	})
	if err != nil {
		logger.Error("error listing secrets", slog.Any("error", err))
		os.Exit(1)
	}

	logger.Info("found secrets to backup", slog.Int("count", len(secrets.Items)))

	var failedClusters []string
	successCount := 0

	for _, secret := range secrets.Items {
		clusterName := secret.Labels["cnpg.io/cluster"]
		namespace := secret.Namespace

		logger.Info("processing cluster backup",
			slog.String("cluster", clusterName),
			slog.String("namespace", namespace))

		// Decode the connection credentials from the secret
		host, err := decodeSecretField(secret.Data, "host")
		if err != nil {
			logger.Error("failed to decode host",
				slog.String("cluster", clusterName),
				slog.Any("error", err))
			failedClusters = append(failedClusters, fmt.Sprintf("%s/%s", namespace, clusterName))
			continue
		}

		port, err := decodeSecretField(secret.Data, "port")
		if err != nil {
			logger.Error("failed to decode port",
				slog.String("cluster", clusterName),
				slog.Any("error", err))
			failedClusters = append(failedClusters, fmt.Sprintf("%s/%s", namespace, clusterName))
			continue
		}

		username, err := decodeSecretField(secret.Data, "username")
		if err != nil {
			logger.Error("failed to decode username",
				slog.String("cluster", clusterName),
				slog.Any("error", err))
			failedClusters = append(failedClusters, fmt.Sprintf("%s/%s", namespace, clusterName))
			continue
		}

		password, err := decodeSecretField(secret.Data, "password")
		if err != nil {
			logger.Error("failed to decode password",
				slog.String("cluster", clusterName),
				slog.Any("error", err))
			failedClusters = append(failedClusters, fmt.Sprintf("%s/%s", namespace, clusterName))
			continue
		}

		// Create backup directory
		backupDir := filepath.Join("/backups", fmt.Sprintf("%s-%s", namespace, clusterName))
		err = os.MkdirAll(backupDir, 0755)
		if err != nil {
			logger.Error("failed to create backup directory",
				slog.String("cluster", clusterName),
				slog.String("directory", backupDir),
				slog.Any("error", err))
			failedClusters = append(failedClusters, fmt.Sprintf("%s/%s", namespace, clusterName))
			continue
		}

		// Generate timestamp for backup filename
		timestamp := strings.ReplaceAll(time.Now().Format(time.RFC3339), ":", "-")
		backupFile := filepath.Join(backupDir, fmt.Sprintf("%s-%s.sql", clusterName, timestamp))

		// Run pg_dumpall with FQDN
		fqdn := fmt.Sprintf("%s.%s.svc.cluster.local", host, namespace)
		success := runPgDumpAll(logger, fqdn, port, username, password, backupFile, clusterName)
		if success {
			successCount++
			logger.Info("backup completed successfully",
				slog.String("cluster", clusterName),
				slog.String("file", backupFile))
		} else {
			failedClusters = append(failedClusters, fmt.Sprintf("%s/%s", namespace, clusterName))
		}
	}

	// Log results and exit with appropriate code
	totalClusters := len(secrets.Items)
	if len(failedClusters) > 0 {
		logger.Error("backup process completed with failures",
			slog.Int("total", totalClusters),
			slog.Int("successful", successCount),
			slog.Int("failed", len(failedClusters)),
			slog.Any("failed_clusters", failedClusters))
		os.Exit(1)
	} else {
		logger.Info("all backups completed successfully",
			slog.Int("total", totalClusters),
			slog.Int("successful", successCount))
		os.Exit(0)
	}
}

func decodeSecretField(data map[string][]byte, field string) (string, error) {
	encoded, exists := data[field]
	if !exists {
		return "", fmt.Errorf("field %s not found in secret", field)
	}

	return string(encoded), nil
}

func runPgDumpAll(logger *slog.Logger, host, port, username, password, outputFile, clusterName string) bool {
	cmd := exec.Command("pg_dumpall", "-h", host, "-p", port, "-U", username)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", password))

	output, err := os.Create(outputFile)
	if err != nil {
		logger.Error("failed to create output file",
			slog.String("cluster", clusterName),
			slog.String("file", outputFile),
			slog.Any("error", err))
		return false
	}
	defer output.Close()

	cmd.Stdout = output

	err = cmd.Run()
	if err != nil {
		logger.Error("pg_dumpall failed",
			slog.String("cluster", clusterName),
			slog.String("host", host),
			slog.String("port", port),
			slog.Any("error", err))
		return false
	}

	return true
}
