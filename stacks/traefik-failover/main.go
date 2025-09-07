package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ganawaj/go-vyos/vyos"
	"github.com/spotahome/kooper/v2/controller"
	kooperlog "github.com/spotahome/kooper/v2/log"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

type KooperLogger struct {
	Logger *slog.Logger
}

func (l KooperLogger) Infof(format string, args ...any) {
	l.Logger.Info(fmt.Sprintf(format, args...))
}

func (l KooperLogger) Warningf(format string, args ...any) {
	l.Logger.Warn(fmt.Sprintf(format, args...))
}

func (l KooperLogger) Errorf(format string, args ...any) {
	l.Logger.Error(fmt.Sprintf(format, args...))
}

func (l KooperLogger) Debugf(format string, args ...any) {
	l.Logger.Debug(fmt.Sprintf(format, args...))
}

func (l KooperLogger) WithKV(kv kooperlog.KV) kooperlog.Logger {
	args := []any{}
	for k, v := range kv {
		args = append(args, k, v)
	}
	return KooperLogger{
		Logger: l.Logger.With(args...),
	}
}

var _ kooperlog.Logger = KooperLogger{}

var DefaultLogger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	AddSource: true,
}))

var FailoverLock = sync.Mutex{}

func K8sClientFromContext(ctx context.Context) *kubernetes.Clientset {
	return ctx.Value("k8sClient").(*kubernetes.Clientset)
}

func NewVyOSClient() *vyos.Client {
	return vyos.NewClient(nil).
		WithToken(os.Getenv("VYOS_API_TOKEN")).
		WithURL("https://172.24.0.0:9443").
		Insecure()
}

func GetCurrentNode(ctx context.Context) (string, error) {
	client := NewVyOSClient()
	refPath := "nat destination rule 2002"
	out, _, err := client.Conf.Get(ctx, refPath, nil)
	if err != nil {
		return "", fmt.Errorf("error getting current node: %w", err)
	}
	data, ok := (out.Data).(map[string]any)
	if !ok {
		return "", fmt.Errorf("unexpected configuration for '%s': %#v", refPath, out.Data)
	}
	translation, ok := data["translation"].(map[string]any)
	if !ok {
		return "", fmt.Errorf("unexpected configuration for '%s translation': %#v", refPath, data["translation"])
	}
	address, ok := translation["address"].(string)
	if !ok {
		return "", fmt.Errorf("unexpected configuration for '%s translation address': %#v", refPath, translation["address"])
	}
	return address, nil
}

func IsNodeHealthy(ctx context.Context, target string) (bool, error) {
	client := &http.Client{
		Timeout: time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	url := fmt.Sprintf("https://%s:443", target)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return false, err
	}

	_, err = client.Do(req)
	if err != nil {
		return false, nil
	}

	return true, nil
}

func FindHealthyNode(ctx context.Context) (string, error) {
	k8s := K8sClientFromContext(ctx)
	nodeList, err := k8s.CoreV1().Nodes().List(ctx, metav1.ListOptions{
		LabelSelector: "k3s.sapslaj.xyz/role=ingress",
	})
	if err != nil {
		return "", err
	}
	fastestNode := make(chan string)
	subCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	for _, node := range nodeList.Items {
		go func() {
			defer func() { recover() }()
			for _, nodeAddress := range node.Status.Addresses {
				logger := DefaultLogger.With(
					slog.String("node_name", node.ObjectMeta.Name),
					slog.String("node_address", nodeAddress.Address),
					slog.Any("node_address_type", nodeAddress.Type),
				)
				if nodeAddress.Type != "InternalIP" {
					logger.InfoContext(ctx, "address not InternalIP, skipping")
					continue
				}
				if !strings.HasPrefix(nodeAddress.Address, "172.24.") {
					logger.InfoContext(ctx, "address not IPv4, skipping")
					continue
				}
				healthy, err := IsNodeHealthy(subCtx, nodeAddress.Address)
				if err != nil {
					logger.WarnContext(ctx, "node health check returned error", slog.Any("error", err))
				}
				if healthy {
					logger.InfoContext(ctx, "node is healthy")
					fastestNode <- nodeAddress.Address
				} else {
					logger.WarnContext(ctx, "node is unhealthy")
				}
			}
		}()
	}

	logger := DefaultLogger
	select {
	case target := <-fastestNode:
		logger = logger.With(slog.String("target", target))
		logger.InfoContext(ctx, "found new healthy node")
		close(fastestNode)
		err := Failover(ctx, target)
		if err != nil {
			logger.ErrorContext(ctx, "error failing over", slog.Any("error", err))
			return target, err
		}
		return target, nil
	case <-time.After(time.Minute):
		logger.ErrorContext(ctx, "node selection timed out after 1 minute")
	case <-ctx.Done():
		logger.ErrorContext(ctx, "node selection was canceled")
	}
	return "", fmt.Errorf("node selection canceled")
}

func Failover(ctx context.Context, target string) error {
	client := NewVyOSClient()

	rules := []int{
		2002,
		2003,
		2004,
		4002,
		4003,
		4004,
	}
	for _, rule := range rules {
		out, _, err := client.Conf.Set(ctx, fmt.Sprintf("nat destination rule %d translation address %s", rule, target))
		if err != nil {
			return fmt.Errorf("updating rule %d failed with error: %w", rule, err)
		}
		if !out.Success {
			return fmt.Errorf("updating rule %d did not succeed: %s", rule, out.Error)
		}
	}

	out, _, err := client.Conf.Save(ctx, "")
	if err != nil {
		return fmt.Errorf("saving configuration failed with error: %w", err)
	}
	if !out.Success {
		return fmt.Errorf("saving configuration did not succeed: %s", out.Error)
	}

	return nil
}

func StartFailover(ctx context.Context) error {
	logger := DefaultLogger
	if !FailoverLock.TryLock() {
		// another goroutine might be trying to failover right now, so let's check
		// if we still need to failover after we get the lock.
		logger.WarnContext(ctx, "another failover happening at same time as this one, waiting")
		FailoverLock.Lock()
		defer FailoverLock.Unlock()

		logger.WarnContext(ctx, "checking if we still need to failover")
		current, err := GetCurrentNode(ctx)
		if err != nil {
			logger.ErrorContext(ctx, "error getting current node", slog.Any("error", err))
			return err
		}

		isHealthy, err := IsNodeHealthy(ctx, current)
		if err != nil {
			logger.ErrorContext(
				ctx,
				"error checking if current node is healthy",
				slog.String("current", current),
				slog.Any("error", err),
			)
			return err
		}

		if !isHealthy {
			logger.InfoContext(ctx, "failover necessary, proceeding", slog.String("current", current))
		} else {
			logger.InfoContext(ctx, "failover not necessary", slog.String("current", current))
			return nil
		}
	} else {
		defer FailoverLock.Unlock()
	}

	logger.InfoContext(ctx, "finding new healthy node")
	target, err := FindHealthyNode(ctx)
	if err != nil {
		logger.ErrorContext(ctx, "error finding new healthy node", slog.Any("error", err))
		return err
	}
	logger.InfoContext(ctx, "failing over to new healthy node", slog.String("target", target))
	err = Failover(ctx, target)
	if err != nil {
		logger.ErrorContext(ctx, "failover failed", slog.String("target", target), slog.Any("error", err))
	}

	logger.InfoContext(ctx, "failover successful", slog.String("target", target))
	return nil
}

func main() {
	ctx := context.Background()

	logger := DefaultLogger

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

	ctx = context.WithValue(ctx, "k8sClient", k8sClient)

	cfg := &controller.Config{
		Name:           "traefik-failover/pods",
		Logger:         KooperLogger{logger},
		ResyncInterval: time.Minute,
		Retriever: controller.MustRetrieverFromListerWatcher(&cache.ListWatch{
			ListWithContextFunc: func(ctx context.Context, options metav1.ListOptions) (runtime.Object, error) {
				options.LabelSelector = "app.kubernetes.io/name=traefik"
				return k8sClient.CoreV1().Pods("traefik").List(ctx, options)
			},
			WatchFuncWithContext: func(ctx context.Context, options metav1.ListOptions) (watch.Interface, error) {
				options.LabelSelector = "app.kubernetes.io/name=traefik"
				return k8sClient.CoreV1().Pods("traefik").Watch(ctx, options)
			},
		}),
		Handler: controller.HandlerFunc(func(ctx context.Context, obj runtime.Object) error {
			ctx = context.WithValue(ctx, "k8sClient", k8sClient)
			pod, ok := obj.(*corev1.Pod)
			if !ok {
				return fmt.Errorf("obj is not a pod: %#v", obj)
			}

			current, err := GetCurrentNode(ctx)
			if err != nil {
				return err
			}
			if pod.Status.HostIP != current {
				return nil
			}

			shouldFailover := false

			for _, containerStatus := range pod.Status.ContainerStatuses {
				if !containerStatus.Ready {
					shouldFailover = true
				}
			}

			if !shouldFailover {
				isHealthy, err := IsNodeHealthy(ctx, current)
				if err != nil {
					return err
				}
				shouldFailover = !isHealthy
			}

			if shouldFailover {
				return StartFailover(ctx)
			}

			return nil
		}),
	}

	ctrl, err := controller.New(cfg)
	if err != nil {
		logger.Error("could not create controller", slog.Any("error", err))
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	err = ctrl.Run(ctx)
	if err != nil {
		logger.Error("error running controller", slog.Any("error", err))
		os.Exit(1)
	}
}
