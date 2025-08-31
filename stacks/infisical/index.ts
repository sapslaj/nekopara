import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { iamPolicyDocument } from "../../components/aws-utils";
import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("infisical", {
  metadata: {
    name: "infisical",
  },
}, { provider });

const iamUser = new aws.iam.User(`authentik-${pulumi.getStack()}`, {});

new aws.iam.UserPolicy("authentik", {
  user: iamUser.name,
  policy: iamPolicyDocument({
    statements: [
      {
        actions: ["ses:SendRawEmail"],
        resources: ["*"],
      },
    ],
  }),
});

const awsSecret = new kubernetes.core.v1.Secret("infisical-aws-credentials", {
  metadata: {
    name: "infisical-aws-credentials",
    namespace: namespace.metadata.name,
    annotations: {
      "aws-credentials-secret-injector.sapslaj.cloud/user-name": iamUser.name,
    },
  },
}, {
  provider,
  ignoreChanges: [
    "data",
    "stringData",
  ],
});

const sesIdentity = new aws.sesv2.EmailIdentity("infisical", {
  emailIdentity: "infisical@sapslaj.cloud",
});

const valkey = new Valkey("infisical", {
  name: "infisical-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.infisical",
  },
  volumeClaimTemplates: [
    {
      name: "data",
      mountPath: "/data",
      spec: {
        storageClassName: "shortrack-mitsuru-red",
        accessModes: [
          "ReadWriteOnce",
        ],
        resources: {
          requests: {
            storage: "10Gi",
          },
        },
      },
    },
  ],
}, {
  providers: {
    kubernetes: provider,
  },
});

const postgresql = new kubernetes.apiextensions.CustomResource("infisical-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "infisical-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
  },
  spec: {
    instances: 2,
    enableSuperuserAccess: true,
    storage: {
      size: "10Gi",
      storageClass: "shortrack-mitsuru-red",
    },
    monitoring: {
      enablePodMonitor: true,
    },
  },
}, { provider });

const encryptionKey = new random.RandomBytes("encryption-key", {
  length: 16,
});

const authSecret = new random.RandomBytes("auth-secret", {
  length: 32,
});

const secret = new kubernetes.core.v1.Secret("infisical", {
  metadata: {
    name: "infisical",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "infisical",
      "app.kubernetes.io/part-of": "infisical",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
  },
  stringData: {
    AUTH_SECRET: authSecret.base64,
    ENCRYPTION_KEY: encryptionKey.hex,
  },
}, { provider });

const serviceAccount = new kubernetes.core.v1.ServiceAccount("infisical", {
  metadata: {
    name: "infisical",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "infisical",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "infisical",
      "app.kubernetes.io/part-of": "infisical",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
  },
}, { provider });

const service = new kubernetes.core.v1.Service("infisical", {
  metadata: {
    name: "infisical",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "infisical",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "infisical",
      "app.kubernetes.io/part-of": "infisical",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
  },
  spec: {
    type: "ClusterIP",
    selector: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "infisical",
      "app.kubernetes.io/name": "infisical",
    },
    ports: [
      {
        name: "http",
        protocol: "TCP",
        port: 80,
        targetPort: 8080,
      },
    ],
  },
}, { provider });

const deployment = new kubernetes.apps.v1.Deployment("infisical", {
  metadata: {
    name: "infisical",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "infisical",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "infisical",
      "app.kubernetes.io/part-of": "infisical",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
    annotations: {
      "reloader.stakater.com/auto": "true",
    },
  },
  spec: {
    replicas: 2,
    selector: {
      matchLabels: {
        "app.kubernetes.io/component": "app",
        "app.kubernetes.io/instance": "infisical",
        "app.kubernetes.io/name": "infisical",
      },
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "app",
          "app.kubernetes.io/instance": "infisical",
          "app.kubernetes.io/managed-by": "Pulumi",
          "app.kubernetes.io/name": "infisical",
          "app.kubernetes.io/part-of": "infisical",
          "k3s.sapslaj.xyz/stack": "nekopara.infisical",
        },
      },
      spec: {
        serviceAccountName: serviceAccount.metadata.name,
        initContainers: [
          {
            name: "schema-migration",
            image: "proxy.oci.sapslaj.xyz/docker-hub/infisical/infisical:v0.93.1-postgres",
            command: [
              "npm",
              "run",
              "migration:latest",
            ],
            env: [
              {
                name: "REDIS_URL",
                value: "redis://infisical-valkey-rw:6379",
              },
              {
                name: "SITE_URL",
                value: "https://infisical.sapslaj.cloud",
              },
              {
                name: "DB_CONNECTION_URI",
                valueFrom: {
                  secretKeyRef: {
                    name: pulumi.concat(postgresql.metadata.name, "-app"),
                    key: "uri",
                  },
                },
              },
              {
                name: "SMTP_HOST",
                value: "email-smtp.us-east-1.amazonaws.com",
              },
              {
                name: "SMTP_USERNAME",
                valueFrom: {
                  secretKeyRef: {
                    name: awsSecret.metadata.name,
                    key: "AWS_ACCESS_KEY_ID",
                  },
                },
              },
              {
                name: "SMTP_PASSWORD",
                valueFrom: {
                  secretKeyRef: {
                    name: awsSecret.metadata.name,
                    key: "AWS_SES_SMTP_PASSWORD_V4",
                  },
                },
              },
              {
                name: "SMTP_PORT",
                value: "465",
              },
              {
                name: "SMTP_FROM_ADDRESS",
                value: sesIdentity.emailIdentity,
              },
              {
                name: "SMTP_FROM_NAME",
                value: "Infisical",
              },
            ],
            envFrom: [
              {
                secretRef: {
                  name: secret.metadata.name,
                },
              },
              {
                secretRef: {
                  name: awsSecret.metadata.name,
                },
              },
            ],
          },
        ],
        containers: [
          {
            name: "infisical",
            image: "proxy.oci.sapslaj.xyz/docker-hub/infisical/infisical:v0.93.1-postgres",
            readinessProbe: {
              initialDelaySeconds: 10,
              periodSeconds: 5,
              httpGet: {
                path: "/api/status",
                port: 8080,
              },
            },
            ports: [
              {
                name: "http",
                containerPort: 8080,
              },
            ],
            env: [
              {
                name: "REDIS_URL",
                value: "redis://infisical-valkey-rw:6379",
              },
              {
                name: "SITE_URL",
                value: "https://infisical.sapslaj.cloud",
              },
              {
                name: "DB_CONNECTION_URI",
                valueFrom: {
                  secretKeyRef: {
                    name: pulumi.concat(postgresql.metadata.name, "-app"),
                    key: "uri",
                  },
                },
              },
            ],
            envFrom: [
              {
                secretRef: {
                  name: secret.metadata.name,
                },
              },
            ],
            resources: {
              limits: {
                memory: "1Gi",
                cpu: "1",
              },
              requests: {
                memory: "512Mi",
                cpu: "350m",
              },
            },
          },
        ],
      },
    },
  },
}, { provider });

const ingress = new kubernetes.networking.v1.Ingress("infisical", {
  metadata: {
    name: "infisical",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "infisical",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "infisical",
      "app.kubernetes.io/part-of": "infisical",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
    annotations: {
      "pulumi.com/skipAwait": "true",
      "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
    },
  },
  spec: {
    ingressClassName: "traefik",
    rules: [
      {
        host: "infisical.sapslaj.cloud",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: service.metadata.name,
                  port: {
                    name: "http",
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
}, { provider });

new IngressDNS("infisical.sapslaj.cloud");
