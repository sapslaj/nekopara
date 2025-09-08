package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"log/slog"
	"os"
	"slices"
	"time"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/iam"
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

const (
	UserNameAnnotation        = "aws-credentials-secret-injector.sapslaj.cloud/user-name"
	ExpiresAtAnnotation       = "aws-credentials-secret-injector.sapslaj.cloud/expires-at"
	TTLAnnotation             = "aws-credentials-secret-injector.sapslaj.cloud/ttl"
	MaintenanceTimeAnnotation = "aws-credentials-secret-injector.sapslaj.cloud/maintenance-time"

	Finalizer = "aws-credentials-secret-injector.sapslaj.cloud/finalizer"

	AWS_ACCESS_KEY_ID        = "AWS_ACCESS_KEY_ID"
	AWS_SECRET_ACCESS_KEY    = "AWS_SECRET_ACCESS_KEY"
	AWS_SES_SMTP_PASSWORD_V4 = "AWS_SES_SMTP_PASSWORD_V4"
)

func generateSesSmtpPassword(secretAccessKey string) string {
	key := secretAccessKey
	region := "us-east-1"
	date := "11111111"
	service := "ses"
	terminal := "aws4_request"
	message := "SendRawEmail"
	version := byte(0x04)

	kDate := hmac.New(sha256.New, []byte("AWS4"+key))
	kDate.Write([]byte(date))
	kDateBytes := kDate.Sum(nil)

	kRegion := hmac.New(sha256.New, kDateBytes)
	kRegion.Write([]byte(region))
	kRegionBytes := kRegion.Sum(nil)

	kService := hmac.New(sha256.New, kRegionBytes)
	kService.Write([]byte(service))
	kServiceBytes := kService.Sum(nil)

	kTerminal := hmac.New(sha256.New, kServiceBytes)
	kTerminal.Write([]byte(terminal))
	kTerminalBytes := kTerminal.Sum(nil)

	kMessage := hmac.New(sha256.New, kTerminalBytes)
	kMessage.Write([]byte(message))
	kMessageBytes := kMessage.Sum(nil)

	signatureAndVersion := append([]byte{version}, kMessageBytes...)
	smtpPassword := base64.StdEncoding.EncodeToString(signatureAndVersion)

	return smtpPassword
}

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

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
	}))

	awscfg, err := awsconfig.LoadDefaultConfig(context.Background())
	if err != nil {
		logger.Error("error loading AWS configuration", slog.Any("error", err))
		os.Exit(1)
	}

	iamClient := iam.NewFromConfig(awscfg)

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

	cfg := &controller.Config{
		Name:           "aws-credentials-secret-injector",
		Logger:         KooperLogger{logger},
		ResyncInterval: time.Minute,
		Retriever: controller.MustRetrieverFromListerWatcher(&cache.ListWatch{
			ListWithContextFunc: func(ctx context.Context, options metav1.ListOptions) (runtime.Object, error) {
				return k8sClient.CoreV1().Secrets("").List(ctx, options)
			},
			WatchFuncWithContext: func(ctx context.Context, options metav1.ListOptions) (watch.Interface, error) {
				return k8sClient.CoreV1().Secrets("").Watch(ctx, options)
			},
		}),
		Handler: controller.HandlerFunc(func(ctx context.Context, obj runtime.Object) error {
			secret, ok := obj.(*corev1.Secret)
			if !ok {
				return fmt.Errorf("obj is not a secret: %#v", obj)
			}
			handlerLogger := logger.With(
				slog.String("secret_namespace", secret.GetNamespace()),
				slog.String("secret_name", secret.GetName()),
			)

			userName, present := secret.Annotations[UserNameAnnotation]
			if !present {
				handlerLogger.DebugContext(ctx, "secret does not contain user-name annotation, skipping")
				return nil
			}

			handlerLogger = handlerLogger.With(
				slog.String("user_name", userName),
			)

			if secret.GetDeletionTimestamp() != nil {
				handlerLogger.InfoContext(ctx, "deleting secret")
				secret.SetFinalizers(slices.DeleteFunc(secret.GetFinalizers(), func(finalizer string) bool {
					return finalizer == Finalizer
				}))

				listAccessKeysOutput, err := iamClient.ListAccessKeys(ctx, &iam.ListAccessKeysInput{
					UserName: &userName,
				})
				if err != nil {
					handlerLogger.ErrorContext(ctx, "error listing access keys", slog.Any("error", err))
					return err
				}
				for _, akm := range listAccessKeysOutput.AccessKeyMetadata {
					_, err := iamClient.DeleteAccessKey(ctx, &iam.DeleteAccessKeyInput{
						AccessKeyId: akm.AccessKeyId,
						UserName:    &userName,
					})
					if err != nil {
						handlerLogger.WarnContext(ctx, "error deleting access key", slog.Any("error", err))
					}
				}

				secret, err = k8sClient.CoreV1().Secrets(secret.GetNamespace()).Update(ctx, secret, metav1.UpdateOptions{})
				if err != nil {
					handlerLogger.ErrorContext(ctx, "error updating secret", slog.Any("error", err))
					return err
				}

				return nil
			}

			if !slices.Contains(secret.GetFinalizers(), Finalizer) {
				handlerLogger.InfoContext(ctx, "adding finalizer")
				secret.SetFinalizers(append(secret.GetFinalizers(), Finalizer))

				secret, err = k8sClient.CoreV1().Secrets(secret.GetNamespace()).Update(ctx, secret, metav1.UpdateOptions{})
				if err != nil {
					handlerLogger.ErrorContext(ctx, "error updating secret", slog.Any("error", err))
					return err
				}
			}

			ttl := time.Hour
			ttlRawValue, present := secret.Annotations[TTLAnnotation]
			if present {
				ttl, err = time.ParseDuration(ttlRawValue)
				if err != nil {
					ttl = time.Hour
					handlerLogger.WarnContext(ctx, "error parsing TTL, using default", slog.Any("error", err))
				}
				handlerLogger.DebugContext(ctx, "parsed ttl", slog.String("ttl", ttl.String()))
			} else {
				handlerLogger.InfoContext(ctx, "ttl annotation not present, assuming default")
				secret.Annotations[TTLAnnotation] = ttl.String()
			}
			handlerLogger.With(slog.String("ttl", ttl.String()))

			expiresAt, present := secret.Annotations[ExpiresAtAnnotation]
			if present {
				handlerLogger = handlerLogger.With(
					slog.String("expires_at", expiresAt),
				)

				parsed, err := time.Parse(time.RFC3339, expiresAt)
				if err != nil {
					handlerLogger.WarnContext(ctx, "error parsing expires-at time", slog.Any("error", err))
				} else if parsed.After(time.Now()) {
					handlerLogger.DebugContext(ctx, "credentials have not expired yet, skipping")
					return nil
				}
				handlerLogger = handlerLogger.With(slog.Time("expired_at", parsed))
				handlerLogger.DebugContext(ctx, "credentials expired")
			} else {
				handlerLogger.InfoContext(ctx, "expires-at annotation not set")
			}

			maintenanceTime, present := secret.Annotations[MaintenanceTimeAnnotation]
			if present {
				start, err := time.Parse(time.TimeOnly, maintenanceTime)
				if err != nil {
					handlerLogger.WarnContext(ctx, "error parsing maintenance-time", slog.Any("error", err))
				}
				now := time.Now()
				// FIXME: this is not a good way to do this
				if now.Hour() != start.Hour() && now.Minute() < start.Minute() {
					handlerLogger.DebugContext(ctx, "maintenance time has not been reached yet, skipping")
				}
			}

			_, err := iamClient.GetUser(ctx, &iam.GetUserInput{
				UserName: &userName,
			})
			if err != nil {
				handlerLogger.ErrorContext(ctx, "error looking up user", slog.Any("error", err))
				return err
			}

			if secret.ObjectMeta.Annotations == nil {
				secret.ObjectMeta.Annotations = map[string]string{}
			}
			if secret.Data == nil {
				secret.Data = map[string][]byte{}
			}

			var oldAccessKeyID string
			oldAccessKeyIDRaw := secret.Data[AWS_ACCESS_KEY_ID]
			if len(oldAccessKeyIDRaw) != 0 {
				oldAccessKeyID = string(oldAccessKeyIDRaw)
				handlerLogger = handlerLogger.With(slog.String("old_access_key_id", oldAccessKeyID))
			} else {
				handlerLogger.InfoContext(ctx, "no previous access key present")
			}

			listAccessKeysOutput, err := iamClient.ListAccessKeys(ctx, &iam.ListAccessKeysInput{
				UserName: &userName,
			})
			if err != nil {
				handlerLogger.ErrorContext(ctx, "error listing access keys", slog.Any("error", err))
				return err
			}
			for _, akm := range listAccessKeysOutput.AccessKeyMetadata {
				if *akm.AccessKeyId != oldAccessKeyID {
					handlerLogger.InfoContext(ctx, "deleting unused access key", slog.String("access_key_id", *akm.AccessKeyId))
					_, err := iamClient.DeleteAccessKey(ctx, &iam.DeleteAccessKeyInput{
						AccessKeyId: akm.AccessKeyId,
						UserName:    &userName,
					})
					if err != nil {
						handlerLogger.ErrorContext(ctx, "error deleting unused access key", slog.Any("error", err))
						return err
					}
				}
			}

			handlerLogger.InfoContext(ctx, "creating new access key and updating secret")
			createAccessKeyOutput, err := iamClient.CreateAccessKey(ctx, &iam.CreateAccessKeyInput{
				UserName: &userName,
			})
			if err != nil {
				handlerLogger.ErrorContext(ctx, "error creating access key", slog.Any("error", err))
				return err
			}

			handlerLogger = handlerLogger.With(slog.String("new_access_key_id", *createAccessKeyOutput.AccessKey.AccessKeyId))

			secret.ObjectMeta.Annotations[ExpiresAtAnnotation] = time.Now().Add(ttl).Format(time.RFC3339)

			sesSmtpPassword := generateSesSmtpPassword(*createAccessKeyOutput.AccessKey.SecretAccessKey)

			secret.Data[AWS_ACCESS_KEY_ID] = []byte(*createAccessKeyOutput.AccessKey.AccessKeyId)
			secret.Data[AWS_SECRET_ACCESS_KEY] = []byte(*createAccessKeyOutput.AccessKey.SecretAccessKey)
			secret.Data[AWS_SES_SMTP_PASSWORD_V4] = []byte(sesSmtpPassword)

			secret, err = k8sClient.CoreV1().Secrets(secret.GetNamespace()).Update(ctx, secret, metav1.UpdateOptions{})
			if err != nil {
				handlerLogger.ErrorContext(ctx, "error updating secret", slog.Any("error", err))
				return err
			}

			if oldAccessKeyID != "" {
				handlerLogger.InfoContext(ctx, "deleting old access key")
				_, err := iamClient.DeleteAccessKey(ctx, &iam.DeleteAccessKeyInput{
					AccessKeyId: &oldAccessKeyID,
					UserName:    &userName,
				})
				if err != nil {
					handlerLogger.ErrorContext(ctx, "error deleting old access key", slog.Any("error", err))
					return err
				}
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
