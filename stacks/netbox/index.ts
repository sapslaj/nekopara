import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("netbox", {
  metadata: {
    name: "netbox",
  },
}, { provider });

const postgresql = new kubernetes.apiextensions.CustomResource("netbox-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "netbox-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.netbox",
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
    bootstrap: {
      initdb: {
        database: "netbox",
        import: {
          type: "microservice",
          databases: [
            "netbox",
          ],
          source: {
            externalCluster: "netbox-homelab-cloud-k8s",
          },
        },
      },
    },
    externalClusters: [
      {
        name: "netbox-homelab-cloud-k8s",
        connectionParameters: {
          host: "k8s.direct.sapslaj.cloud",
          user: "postgres",
          dbname: "netbox",
          password: "dhpz3kauhi",
          port: "30100",
        },
      },
    ],
  },
}, { provider });

const valkey = new Valkey("netbox-valkey", {
  name: "netbox-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/component": "valkey",
    "app.kubernetes.io/instance": "netbox-valkey",
    "app.kubernetes.io/name": "netbox-valkey",
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.netbox",
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

const secretKey = new random.RandomPassword("netbox-secret-key", {
  length: 64,
});

// just a placeholder because the Helm chart insists there has to be a secret
// for the superuser
const superuserSecret = new kubernetes.core.v1.Secret("netbox-superuser", {
  metadata: {
    name: "netbox-superuser",
    namespace: namespace.metadata.name,
  },
  type: "kubernetes.io/basic-auth",
  stringData: {
    api_token: new random.RandomBytes("netbox-superadmin", {
      length: 64,
    }).hex,
    email: "admin@sapslaj.com",
    password: new random.RandomPassword("netbox-superadmin", {
      length: 64,
    }).result,
    username: "superuser",
  },
}, { provider });

const chart = new kubernetes.helm.v4.Chart("netbox", {
  chart: "oci://ghcr.io/netbox-community/netbox-chart/netbox",
  version: "6.1.12",
  namespace: namespace.metadata.name,
  skipCrds: true,
  values: {
    superuser: {
      existingSecret: superuserSecret.metadata.name,
    },
    secretKey: secretKey.result,
    persistence: {
      enabled: true,
      storageClass: "nfs",
      accessMode: "ReadWriteMany",
    },
    ingress: {
      enabled: true,
      className: "traefik",
      hosts: [
        {
          host: "netbox.sapslaj.cloud",
          paths: [
            "/",
          ],
        },
      ],
    },
    metrics: {
      enabled: true,
      serviceMonitor: {
        enabled: true,
      },
    },
    postgresql: {
      enabled: false,
    },
    externalDatabase: {
      host: "netbox-postgresql-rw",
      port: 5432,
      database: "netbox",
      username: "netbox",
      existingSecretName: "netbox-postgresql-app",
      existingSecretKey: "password",
    },
    valkey: {
      enabled: false,
    },
    tasksDatabase: {
      host: valkey.readWriteService.metadata.name,
    },
    cachingDatabase: {
      host: valkey.readWriteService.metadata.name,
    },
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("netbox.sapslaj.cloud", {
  hostname: "netbox.sapslaj.cloud",
}, {
  providers: {
    kubernetes: provider,
  },
});
