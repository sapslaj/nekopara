import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as time from "@pulumiverse/time";
import * as authentik from "@sapslaj/pulumi-authentik";

import { iamPolicyDocument } from "../../components/aws-utils";
import { getSecretValueOutput } from "../../components/infisical";
import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const iamUser = new aws.iam.User(`nextcloud-${pulumi.getStack()}`, {});

const iamKeyRotation = new time.Rotating("nextcloud-iam-key", {
  rotationDays: 30,
});

const iamKey = new aws.iam.AccessKey("nextcloud", {
  user: iamUser.name,
}, {
  deleteBeforeReplace: false,
  dependsOn: [iamKeyRotation],
});

new aws.iam.UserPolicy("nextcloud", {
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

const sesIdentity = new aws.sesv2.EmailIdentity("authentik", {
  emailIdentity: "nextcloud@sapslaj.cloud",
});

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("nextcloud", {
  metadata: {
    name: "nextcloud",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAccess = new authentik.Group("nextcloud-access", {
  name: "Nextcloud Access",
});

const authentikGroupAdmins = new authentik.Group("nextcloud-admins", {
  name: "Nextcloud Admins",
});

const authentikProvider = new authentik.ProviderOauth2("nextcloud", {
  name: "Nextcloud",
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
      url: "https://nextcloud.sapslaj.cloud/apps/user_oidc/code",
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

const authentikApplication = new authentik.Application("nextcloud", {
  name: "Nextcloud",
  slug: "nextcloud",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

new authentik.PolicyBinding("nextcloud-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const postgresql = new kubernetes.apiextensions.CustomResource("nextcloud-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "nextcloud-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.nextcloud",
    },
  },
  spec: {
    instances: 3,
    enableSuperuserAccess: true,
    bootstrap: {
      initdb: {
        database: "nextcloud",
        owner: "nextcloud",
      },
    },
    storage: {
      size: "10Gi",
      storageClass: "shortrack-mitsuru-red",
    },
    monitoring: {
      enablePodMonitor: true,
    },
  },
}, { provider });

const valkey = new Valkey("nextcloud-valkey", {
  name: "nextcloud-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/component": "valkey",
    "app.kubernetes.io/instance": "nextcloud-valkey",
    "app.kubernetes.io/name": "nextcloud-valkey",
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.nextcloud",
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

const adminPassword = new random.RandomPassword("nextcloud-admin-password", {
  length: 64,
});

const adminSecret = new kubernetes.core.v1.Secret("nextcloud-admin", {
  metadata: {
    name: "nextcloud-admin",
    namespace: namespace.metadata.name,
  },
  stringData: {
    "nextcloud-username": "admin",
    "nextcloud-password": adminPassword.result,
    "nextcloud-token": getSecretValueOutput({
      key: "nextcloud-token",
    }),
    "smtp-username": iamKey.id,
    "smtp-password": iamKey.sesSmtpPasswordV4,
    "smtp-host": "email-smtp.us-east-1.amazonaws.com",
  },
}, { provider });

const collaboraAdminSecret = new kubernetes.core.v1.Secret("nextcloud-collabora-admin", {
  metadata: {
    name: "nextcloud-collabora-admin",
    namespace: namespace.metadata.name,
  },
  stringData: {
    username: "nextcloudadmin",
    password: new random.RandomPassword("nextcloud-collabora-admin", {
      length: 64,
    }).result,
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("nextcloud", {
  chart: "nextcloud",
  fetchOpts: {
    repo: "https://nextcloud.github.io/helm/",
  },
  version: "7.0.4",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    image: {
      repository: "proxy.oci.sapslaj.xyz/docker-hub/nextcloud",
      flavor: "fpm",
      tag: "31.0.8-fpm"
    },
    replicaCount: 2,
    ingress: {
      enabled: true,
      className: "traefik",
      annotations: {
        "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
      },
    },
    nextcloud: {
      host: "nextcloud.sapslaj.cloud",
      existingSecret: {
        enabled: true,
        secretName: adminSecret.metadata.name,
        tokenKey: "nextcloud-token",
      },
      mail: {
        enabled: true,
        fromAddress: "nextcloud",
        domain: "sapslaj.cloud",
        smtp: {
          host: "email-smtp.us-east-1.amazonaws.com",
          secure: "tls",
          port: 587,
        },
      },
      objectStore: {
        s3: {
          enabled: false,
          host: "172.24.4.10",
          ssl: false,
          port: "8333",
          region: "",
          bucket: "nextcloud-data",
          usePathStyle: true,
        },
      },
      strategy: {
        type: "RollingUpdate",
      },
      extraEnv: [
        {
          name: "REDIS_HOST",
          value: valkey.readWriteService.metadata.name,
        },
        {
          name: "REDIS_HOST_PORT",
          value: "6379",
        },
      ],
      extraVolumes: [
        {
          name: "nextcloud-main",
          nfs: {
            server: "172.24.4.11",
            path: "/red/nfs/nextcloud",
            readOnly: false,
          },
        },
      ],
    },
    nginx: {
      enabled: true,
      image: {
        repository: "proxy.oci.sapslaj.xyz/docker-hub/nginx",
      },
    },
    internalDatabase: {
      enabled: false,
    },
    externalDatabase: {
      enabled: true,
      type: "postgresql",
      existingSecret: {
        enabled: true,
        secretName: pulumi.interpolate`${postgresql.metadata.name}-app`,
        usernameKey: "user",
        passwordKey: "password",
        hostKey: "host",
        databaseKey: "dbname",
      },
    },
    collabora: {
      enabled: true,
      image: {
        repository: "proxy.oci.sapslaj.xyz/docker-hub/collabora/code",
      },
      collabora: {
        extra_params: "--o:ssl.enable=false --o:ssl.termination=true",
        server_name: "nextcloud-collabora.sapslaj.cloud",
        existingSecret: {
          enabled: true,
          secretName: collaboraAdminSecret.metadata.name,
          usernameKey: "username",
          passwordKey: "password",
        },
      },
      prometheus: {
        servicemonitor: {
          enabled: true,
        },
        rules: {
          enabled: false,
        },
      },
      grafana: {
        dashboards: {
          enabled: true,
        },
      },
      deployment: {
        customFonts: {
          enabled: true,
          pvc: {
            accessMode: "ReadWriteMany",
            storageClassName: "nfs",
          },
          image: {
            repository: "proxy.oci.sapslaj.xyz/docker-hub/alpine",
          },
        },
      },
      ingress: {
        enabled: true,
        className: "traefik",
        hosts: [
          // TODO: block certain subpaths
          {
            host: "nextcloud-collabora.sapslaj.cloud",
            paths: [
              {
                path: "/",
                pathType: "Prefix",
              },
            ],
          },
        ],
      },
      replicaCount: 2,
    },
    cronjob: {
      enabled: true,
    },
    persistence: {
      enabled: false,
      nextcloudData: {
        enabled: false,
        storageClass: "nfs",
        accessMode: "ReadWriteMany",
      },
    },
    imaginary: {
      enabled: false,
    },
    metrics: {
      enabled: true,
      server: "https://nextcloud.sapslaj.cloud:443",
      https: true,
      info: {
        apps: true,
        update: true,
      },
      image: {
        repository: "proxy.oci.sapslaj.xyz/docker-hub/xperimental/nextcloud-exporter",
      },
      serviceMonitor: {
        enabled: true,
      },
      rules: {
        enabled: false,
      },
    },
    rbac: {
      enabled: true,
    },
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind === "Deployment" && obj.metadata?.name === "nextcloud") {
        const dropEnvVar = [
          "NEXTCLOUD_ADMIN_USER",
          "NEXTCLOUD_ADMIN_PASSWORD",
          "OBJECTSTORE_S3_REGION",
          "OBJECTSTORE_S3_KET",
          "OBJECTSTORE_S3_SECRET",
          "OBJECTSTORE_S3_SSE_C_KEY",
        ];
        for (let i = 0; i < obj.spec.template.spec.containers.length; i++) {
          if (obj.spec.template.spec.containers[i].env) {
            obj.spec.template.spec.containers[i].env = obj.spec.template.spec.containers[i].env.filter((envvar) => {
              return !dropEnvVar.includes(envvar.name);
            });
          }
        }
        obj.spec.template.spec.volumes = obj.spec.template.spec.volumes.filter((volume) => {
          return !(volume.name === "nextcloud-main" && "emptyDir" in volume);
        });
      }
    },
  ],
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("nextcloud.sapslaj.cloud");
new IngressDNS("nextcloud-collabora.sapslaj.cloud");
