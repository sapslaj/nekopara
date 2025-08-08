import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";

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
      storageClass: "shortrack-aqua-exos",
    },
    monitoring: {
      enablePodMonitor: true,
    },
  },
}, { provider });

const valkeyService = new kubernetes.core.v1.Service("authentik-valkey", {
  metadata: {
    name: "authentik-valkey",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "valkey",
      "app.kubernetes.io/instance": "authentik-valkey",
      "app.kubernetes.io/name": "authentik-valkey",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
    },
  },
  spec: {
    selector: {
      "app.kubernetes.io/component": "valkey",
      "app.kubernetes.io/instance": "authentik-valkey",
      "app.kubernetes.io/name": "authentik-valkey",
    },
    ports: [
      {
        name: "tcp-valkey",
        port: 6379,
        protocol: "TCP",
        targetPort: "tcp-valkey",
      },
    ],
  },
}, { provider });

const valkey = new kubernetes.apps.v1.StatefulSet("authentik-valkey", {
  metadata: {
    name: "authentik-valkey",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "valkey",
      "app.kubernetes.io/instance": "authentik-valkey",
      "app.kubernetes.io/name": "authentik-valkey",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.authentik",
    },
  },
  spec: {
    replicas: 1,
    serviceName: valkeyService.metadata.name,
    selector: {
      matchLabels: valkeyService.spec.selector,
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "valkey",
          "app.kubernetes.io/instance": "authentik-valkey",
          "app.kubernetes.io/name": "authentik-valkey",
          "app.kubernetes.io/managed-by": "Pulumi",
          "k3s.sapslaj.xyz/stack": "nekopara.authentik",
        },
      },
      spec: {
        containers: [
          {
            name: "valkey",
            image: "valkey/valkey:8",
            ports: [
              {
                name: "tcp-valkey",
                containerPort: 6379,
                protocol: "TCP",
              },
            ],
          },
        ],
      },
    },
    persistentVolumeClaimRetentionPolicy: {
      whenDeleted: "Delete",
      whenScaled: "Delete",
    },
  },
}, {
  provider,
  dependsOn: [
    valkeyService,
  ],
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
    // TODO:
    // AUTHENTIK_EMAIL__PORT: "",
    // AUTHENTIK_EMAIL__TIMEOUT: "",
    // AUTHENTIK_EMAIL__USE_SSL: "",
    // AUTHENTIK_EMAIL__USE_TLS: "",
    AUTHENTIK_ENABLED: "true",
    AUTHENTIK_ERROR_REPORTING__ENABLED: "false",
    AUTHENTIK_SECRET_KEY: secretKey.result,
    AUTHENTIK_POSTGRESQL__SSLMODE: "require",
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
          value: valkeyService.metadata.name,
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
});

new aws.route53.Record("login.sapslaj.cloud", {
  name: "login.sapslaj.cloud",
  type: "CNAME",
  records: [
    "homelab.sapslaj.com",
  ],
  ttl: 300,
  zoneId: aws.route53.getZoneOutput({
    name: "sapslaj.cloud",
  }).zoneId,
});
