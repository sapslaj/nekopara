import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as authentik from "@sapslaj/pulumi-authentik";

import { iamPolicyDocument } from "../../components/aws-utils";
import { newK3sProvider } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const image = "oci.sapslaj.xyz/infisical/infisical:2025-08-31T22-30-13-04-00";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("infisical", {
  metadata: {
    name: "infisical",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAccess = new authentik.Group("infisical-access", {
  name: "Infisical Access",
});

const authentikProvider = new authentik.ProviderOauth2("infisical", {
  name: "Infisical",
  clientId: clientID.id,
  authorizationFlow: authentik.getFlowOutput({
    slug: "default-provider-authorization-implicit-consent",
  }).id,
  invalidationFlow: authentik.getFlowOutput({
    slug: "default-provider-invalidation-flow",
  }).id,
  allowedRedirectUris: [
    {
      matching_mode: "strict",
      url: "https://infisical.sapslaj.cloud/api/v1/sso/oidc/callback",
    },
  ],
  propertyMappings: [
    authentik.getPropertyMappingProviderScopeOutput({
      name: "authentik default OAuth Mapping: OpenID 'email'",
    }).id,
    authentik.getPropertyMappingProviderScopeOutput({
      name: "authentik default OAuth Mapping: OpenID 'profile'",
    }).id,
    authentik.getPropertyMappingProviderScopeOutput({
      name: "authentik default OAuth Mapping: OpenID 'openid'",
    }).id,
  ],
});

const authentikApplication = new authentik.Application("infisical", {
  name: "Infisical",
  slug: "infisical",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

new authentik.PolicyBinding("infisical-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const iamUser = new aws.iam.User(`infisical-${pulumi.getStack()}`, {});

const iamRole = new aws.iam.Role(`infisical-${pulumi.getStack()}`, {
  name: iamUser.name,
  assumeRolePolicy: iamPolicyDocument({
    statements: [
      {
        actions: ["sts:AssumeRole"],
        principals: [
          {
            type: "AWS",
            identifiers: [iamUser.arn],
          },
        ],
      },
    ],
  }),
});

new aws.iam.UserPolicy("infisical", {
  user: iamUser.name,
  policy: iamPolicyDocument({
    statements: [
      {
        actions: ["ses:SendRawEmail"],
        resources: ["*"],
      },
      {
        actions: ["sts:AssumeRole"],
        resources: [iamRole.arn],
      },
    ],
  }),
});

new aws.iam.RolePolicy("infisical", {
  role: iamRole.name,
  policy: iamPolicyDocument({
    statements: [
      {
        actions: [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ListAliases",
        ],
        resources: ["*"],
      },
      {
        actions: [
          "secretsmanager:BatchGetSecretValue",
          "secretsmanager:CreateSecret",
          "secretsmanager:DeleteSecret",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:ListSecrets",
          "secretsmanager:TagResource",
          "secretsmanager:UntagResource",
          "secretsmanager:UpdateSecret",
        ],
        resources: ["*"],
      },
      {
        actions: [
          "ssm:PutParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:DescribeParameters",
          "ssm:DeleteParameters",
          "ssm:ListTagsForResource",
          "ssm:AddTagsToResource",
          "ssm:RemoveTagsFromResource",
        ],
        resources: ["*"],
      },
    ],
  }),
});

const awsSecret = new kubernetes.core.v1.Secret("infisical-aws-credentials", {
  metadata: {
    name: "infisical-aws-credentials",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
    annotations: {
      "aws-credentials-secret-injector.sapslaj.cloud/user-name": iamUser.name,
      "aws-credentials-secret-injector.sapslaj.cloud/maintenance-time": "06:10:00",
    },
  },
}, {
  provider,
  ignoreChanges: [
    "data",
    "stringData",
  ],
});

const licenseSecret = new kubernetes.core.v1.Secret("infisical-license", {
  metadata: {
    name: "infisical-license",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
  },
  stringData: {
    LICENSE_KEY: aws.ssm.getParameterOutput({
      name: "/nekopara/infisical/license-key",
    }).value,
  },
}, {
  provider,
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

const appConnectionsSMSecret = new aws.secretsmanager.Secret("infisical-app-connections");

const appConnectionsExternalSecret = new kubernetes.apiextensions.CustomResource(
  "infisical-app-connections-externalsecret",
  {
    apiVersion: "external-secrets.io/v1",
    kind: "ExternalSecret",
    metadata: {
      name: "infisical-app-connections",
      namespace: namespace.metadata.name,
    },
    spec: {
      refreshInterval: "1h",
      secretStoreRef: {
        kind: "ClusterSecretStore",
        name: "aws-secretsmanager-us-east-1",
      },
      target: {
        name: "infisical-app-connections",
      },
      dataFrom: [
        {
          extract: {
            key: appConnectionsSMSecret.name,
          },
        },
      ],
    },
  },
  { provider },
);

const env: pulumi.Input<kubernetes.types.input.core.v1.EnvVar>[] = [
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
    name: "LICENSE_KEY",
    valueFrom: {
      secretKeyRef: {
        name: licenseSecret.metadata.name,
        key: "LICENSE_KEY",
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
    value: "587",
  },
  {
    name: "SMTP_FROM_ADDRESS",
    value: sesIdentity.emailIdentity,
  },
  {
    name: "SMTP_FROM_NAME",
    value: "Infisical",
  },
  {
    name: "INF_APP_CONNECTION_AWS_ACCESS_KEY_ID",
    valueFrom: {
      secretKeyRef: {
        name: awsSecret.metadata.name,
        key: "AWS_ACCESS_KEY_ID",
      },
    },
  },
  {
    name: "INF_APP_CONNECTION_AWS_SECRET_ACCESS_KEY",
    valueFrom: {
      secretKeyRef: {
        name: awsSecret.metadata.name,
        key: "AWS_SECRET_ACCESS_KEY",
      },
    },
  },
];

const envFrom: pulumi.Input<kubernetes.types.input.core.v1.EnvFromSource>[] = [
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
  {
    secretRef: {
      name: appConnectionsExternalSecret.metadata.name,
    },
  },
];

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
      "reloader.stakater.com/rollout-strategy": "restart",
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
            image,
            command: [
              "npm",
              "run",
              "migration:latest",
            ],
            env,
            envFrom,
          },
        ],
        containers: [
          {
            name: "infisical",
            image,
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
            env,
            envFrom,
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
