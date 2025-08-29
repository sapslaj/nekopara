import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { newK3sProvider } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("gitea", {
  metadata: {
    name: "gitea",
  },
}, { provider });

const valkey = new Valkey("gitea", {
  name: "gitea-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.gitea",
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

const postgresql = new kubernetes.apiextensions.CustomResource("gitea-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "gitea-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.gitea",
    },
  },
  spec: {
    instances: 2,
    enableSuperuserAccess: true,
    bootstrap: {
      initdb: {
        database: "gitea",
        owner: "gitea",
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

const adminSecret = new kubernetes.core.v1.Secret("gitea-admin", {
  metadata: {
    name: "gitea-admin",
    namespace: namespace.metadata.name,
  },
  stringData: {
    username: "admin",
    password: new random.RandomPassword("gitea-admin", {
      length: 64,
    }).result,
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("gitea", {
  chart: "gitea",
  fetchOpts: {
    repo: "https://dl.gitea.com/charts/",
  },
  version: "12.2.0",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    ingress: {
      enabled: false,
      className: "traefik",
      annotations: {
        "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
      },
      hosts: [
        {
          host: "git.sapslaj.cloud",
          paths: [
            {
              path: "/",
            },
          ],
        },
      ],
    },
    deployment: {
      env: [
        {
          name: "GITEA__DATABASE__HOST",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "host",
            },
          },
        },
        {
          name: "GITEA__DATABASE__NAME",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "dbname",
            },
          },
        },
        {
          name: "GITEA__DATABASE__USER",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "user",
            },
          },
        },
        {
          name: "GITEA__DATABASE__PASSWD",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "password",
            },
          },
        },
      ],
    },
    persistence: {
      enabled: true,
      accessModes: [
        "ReadWriteMany",
      ],
      storageClass: "nfs",
    },
    gitea: {
      admin: {
        existingSecret: adminSecret.metadata.name,
      },
      metrics: {
        enabled: true,
        serviceMonitor: {
          enabled: true,
        },
      },
      config: {
        database: {
          DB_TYPE: "postgres",
        },
        queue: {
          TYPE: "redis",
          CONN_STR: pulumi.interpolate`redis://${valkey.readWriteService.metadata.name}:6379/0`,
        },
        admin: {},
        security: {},
        camo: {},
        openid: {},
        oauth2_client: {},
        service: {
          DISABLE_REGISTRATION: true,
        },
        webhook: {},
        mailer: {},
        cache: {
          ADAPTER: "redis",
          HOST: pulumi.interpolate`redis://${valkey.readWriteService.metadata.name}:6379/2`,
        },
        session: {
          PROVIDER: "redis",
          PROVIDER_CONFIG: pulumi.interpolate`redis://${valkey.readWriteService.metadata.name}:6379/1`,
        },
        picture: {},
        project: {},
      },
    },
    "valkey-cluster": {
      enabled: false,
    },
    valkey: {
      enabled: false,
    },
    "postgresql-ha": {
      enabled: false,
    },
    postgresql: {
      enabled: false,
    },
  },
}, {
  provider,
});

new IngressDNS("git.sapslaj.cloud");
