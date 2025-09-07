import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as std from "@pulumi/std";
import * as time from "@pulumiverse/time";

import { iamPolicyDocument } from "../../components/aws-utils";
import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const iamUser = new aws.iam.User(`authentik-${pulumi.getStack()}`, {});

const iamKeyRotation = new time.Rotating("authentik-iam-key", {
  rotationDays: 30,
});

const iamKey = new aws.iam.AccessKey("authentik", {
  user: iamUser.name,
}, {
  deleteBeforeReplace: false,
  dependsOn: [iamKeyRotation],
});

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

const sesIdentity = new aws.sesv2.EmailIdentity("authentik", {
  emailIdentity: "login@sapslaj.cloud",
});

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("authentik", {
  metadata: {
    name: "authentik",
  },
}, { provider });

const postgresql = new kubernetes.apiextensions.CustomResource("authentik-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "authentik-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
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

const valkey = new Valkey("authentik-valkey", {
  name: "authentik-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/component": "valkey",
    "app.kubernetes.io/instance": "authentik-valkey",
    "app.kubernetes.io/name": "authentik-valkey",
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.authentik",
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

const secretKey = new random.RandomPassword("authentik-secret-key", {
  length: 64,
  special: false,
});

const configSecret = new kubernetes.core.v1.Secret("authentik", {
  metadata: {
    name: "authentik",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "authentik",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "authentik",
      "app.kubernetes.io/part-of": "authentik",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
    },
  },
  stringData: {
    AUTHENTIK_EMAIL__HOST: "email-smtp.us-east-1.amazonaws.com",
    AUTHENTIK_EMAIL__PORT: "587",
    AUTHENTIK_EMAIL__TIMEOUT: "10",
    // AUTHENTIK_EMAIL__USE_SSL: "",
    AUTHENTIK_EMAIL__FROM: sesIdentity.emailIdentity,
    AUTHENTIK_EMAIL__USE_TLS: "true",
    AUTHENTIK_EMAIL__USERNAME: iamKey.id,
    AUTHENTIK_EMAIL__PASSWORD: iamKey.sesSmtpPasswordV4,
    AUTHENTIK_ENABLED: "true",
    AUTHENTIK_ERROR_REPORTING__ENABLED: "false",
    AUTHENTIK_SECRET_KEY: secretKey.result,
    AUTHENTIK_POSTGRESQL__SSLMODE: "require",
  },
}, { provider });

const mediaPVC = new kubernetes.core.v1.PersistentVolumeClaim("authentik-media", {
  metadata: {
    name: "authentik-media",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "authentik",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "authentik-media",
      "app.kubernetes.io/part-of": "authentik",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
    },
  },
  spec: {
    accessModes: [
      "ReadWriteMany",
    ],
    storageClassName: "nfs-mitsuru",
    resources: {
      requests: {
        storage: "10Gi",
      },
    },
  },
}, { provider });

const geoipPVC = new kubernetes.core.v1.PersistentVolumeClaim("authentik-geoip", {
  metadata: {
    name: "authentik-geoip",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "authentik",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "authentik-geoip",
      "app.kubernetes.io/part-of": "authentik",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
    },
  },
  spec: {
    accessModes: [
      "ReadWriteMany",
    ],
    storageClassName: "nfs-mitsuru",
    resources: {
      requests: {
        storage: "10Gi",
      },
    },
  },
}, { provider });

new kubernetes.batch.v1.CronJob("authentik-geoip-update", {
  metadata: {
    name: "authentik-geoip-update",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "authentik",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "authentik-geoip-update",
      "app.kubernetes.io/part-of": "authentik",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
    },
  },
  spec: {
    schedule: "@weekly",
    jobTemplate: {
      spec: {
        template: {
          spec: {
            restartPolicy: "OnFailure",
            containers: [
              {
                name: "authentik-geoip-update",
                image: "public.ecr.aws/docker/library/alpine:latest",
                command: [
                  "/bin/sh",
                  "-c",
                  [
                    "set -euxo pipefail",
                    "apk add wget",
                    "wget https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb",
                    "wget https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb",
                    "wget https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb",
                    "mv ./GeoLite2-ASN.mmdb /geoip/",
                    "mv ./GeoLite2-City.mmdb /geoip/",
                    "mv ./GeoLite2-Country.mmdb /geoip/",
                    "",
                  ].join("\n"),
                ],
                volumeMounts: [
                  {
                    name: "geoip",
                    mountPath: "/geoip",
                  },
                ],
              },
            ],
            volumes: [
              {
                name: "geoip",
                persistentVolumeClaim: {
                  claimName: geoipPVC.metadata.name,
                },
              },
            ],
          },
        },
      },
    },
  },
}, { provider });

const authentik = new kubernetes.helm.v3.Chart("authentik", {
  chart: "authentik",
  version: "2025.6.4",
  fetchOpts: {
    repo: "https://charts.goauthentik.io",
  },
  skipCRDRendering: true,
  namespace: namespace.metadata.name,
  values: {
    global: {
      podAnnotations: {
        "checksum/secret": std.sha256Output({
          input: std.jsonencodeOutput({
            input: configSecret.data,
          }).result,
        }).result,
      },
      env: [
        {
          name: "AUTHENTIK_POSTGRESQL__HOST",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.interpolate`${postgresql.metadata.name}-app`,
              key: "host",
            },
          },
        },
        {
          name: "AUTHENTIK_POSTGRESQL__NAME",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.interpolate`${postgresql.metadata.name}-app`,
              key: "dbname",
            },
          },
        },
        {
          name: "AUTHENTIK_POSTGRESQL__PORT",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.interpolate`${postgresql.metadata.name}-app`,
              key: "port",
            },
          },
        },
        {
          name: "AUTHENTIK_POSTGRESQL__USER",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.interpolate`${postgresql.metadata.name}-app`,
              key: "user",
            },
          },
        },
        {
          name: "AUTHENTIK_POSTGRESQL__PASSWORD",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.interpolate`${postgresql.metadata.name}-app`,
              key: "password",
            },
          },
        },
        {
          name: "AUTHENTIK_REDIS__HOST",
          value: valkey.readWriteService.metadata.name,
        },
      ],
      volumeMounts: [
        {
          name: "media",
          mountPath: "/media",
        },
        {
          name: "geoip",
          mountPath: "/geoip",
        },
      ],
      volumes: [
        {
          name: "media",
          persistentVolumeClaim: {
            claimName: mediaPVC.metadata.name,
          },
        },
        {
          name: "geoip",
          persistentVolumeClaim: {
            claimName: geoipPVC.metadata.name,
          },
        },
      ],
    },
    authentik: {
      enabled: false,
    },
    server: {
      enabled: true,
      replicas: 2,
      pdb: {
        enabled: true,
        minAvailable: 1,
      },
      metrics: {
        enabled: true,
        serviceMonitor: {
          enabled: true,
        },
      },
      ingress: {
        enabled: true,
        annotations: {
          "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
        },
        ingressClassName: "traefik",
        hosts: [
          "login.sapslaj.cloud",
        ],
      },
    },
    worker: {
      enabled: true,
      replicas: 1,
    },
    prometheus: {
      rules: {
        enabled: true,
      },
    },
    postgresql: {
      enabled: false,
    },
    redis: {
      enabled: false,
    },
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
  dependsOn: [
    configSecret,
  ],
});

new IngressDNS("login.sapslaj.cloud");
