package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"log/slog"
	"os"
	"slices"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
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
	UserNameAnnotation  = "aws-credentials-secret-injector.sapslaj.cloud/user-name"
	ExpiresAtAnnotation = "aws-credentials-secret-injector.sapslaj.cloud/expires-at"

	Finalizer = "aws-credentials-secret-injector.sapslaj.cloud/finalizer"

	AWS_ACCESS_KEY_ID     = "AWS_ACCESS_KEY_ID"
	AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY"
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

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
	}))

	awscfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				os.Getenv("AWS_ACCESS_KEY_ID"),
				os.Getenv("AWS_SECRET_ACCESS_KEY"),
				"",
			),
		),
	)
	if err != nil {
		logger.Error("error loading AWS configuration", slog.Any("error", err))
		os.Exit(1)
	}

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

			iamClient := iam.NewFromConfig(awscfg)

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
			} else {
				handlerLogger.InfoContext(ctx, "expires-at annotation not set")
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
				buf, err := base64.StdEncoding.DecodeString(string(oldAccessKeyIDRaw))
				if err != nil {
					handlerLogger.ErrorContext(ctx, "error decoding previous access key ID from secret", slog.Any("error", err))
					return err
				}
				oldAccessKeyID = string(buf)
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

			secret.ObjectMeta.Annotations[ExpiresAtAnnotation] = time.Now().Add(time.Hour).Format(time.RFC3339)

			secret.Data[AWS_ACCESS_KEY_ID] = []byte(base64.StdEncoding.EncodeToString([]byte(*createAccessKeyOutput.AccessKey.AccessKeyId)))
			secret.Data[AWS_SECRET_ACCESS_KEY] = []byte(base64.StdEncoding.EncodeToString([]byte(*createAccessKeyOutput.AccessKey.SecretAccessKey)))

			secret, err = k8sClient.CoreV1().Secrets(secret.GetNamespace()).Update(ctx, secret, metav1.UpdateOptions{})
			if err != nil {
				handlerLogger.ErrorContext(ctx, "error updating secret", slog.Any("error", err))
				return err
			}

			if secret.GetNamespace() == "aws-credentials-secret-injector" && secret.GetName() == "aws-credentials-secret-injector" {
				handlerLogger.InfoContext(ctx, "detected update for aws-credentials-secret-injector, re-initializing AWS config.")
				awscfg, err = awsconfig.LoadDefaultConfig(
					context.Background(),
					config.WithCredentialsProvider(
						credentials.NewStaticCredentialsProvider(
							*createAccessKeyOutput.AccessKey.AccessKeyId,
							*createAccessKeyOutput.AccessKey.SecretAccessKey,
							"",
						),
					),
				)
				if err != nil {
					handlerLogger.Error("error loading AWS configuration", slog.Any("error", err))
					return err
				}
				iamClient = iam.NewFromConfig(awscfg)
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
