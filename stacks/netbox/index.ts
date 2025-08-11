import * as random from "@pulumi/random";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { getDnsFullName, getDnsHostName, newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { DNSRecord } from "../../components/shimiko/DNSRecord";

const provider = newK3sProvider();
const dnsFullName = getDnsFullName();
const dnsHostName = getDnsHostName();

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
    instances: 1,
    enableSuperuserAccess: true,
    storage: {
      size: "10Gi",
      storageClass: "shortrack-aqua-exos",
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

const valkeyService = new kubernetes.core.v1.Service("netbox-valkey", {
  metadata: {
    name: "netbox-valkey",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "valkey",
      "app.kubernetes.io/instance": "netbox-valkey",
      "app.kubernetes.io/name": "netbox-valkey",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.netbox",
    },
  },
  spec: {
    selector: {
      "app.kubernetes.io/component": "valkey",
      "app.kubernetes.io/instance": "netbox-valkey",
      "app.kubernetes.io/name": "netbox-valkey",
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

const valkey = new kubernetes.apps.v1.StatefulSet("netbox-valkey", {
  metadata: {
    name: "netbox-valkey",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "valkey",
      "app.kubernetes.io/instance": "netbox-valkey",
      "app.kubernetes.io/name": "netbox-valkey",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.netbox",
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
          "app.kubernetes.io/instance": "netbox-valkey",
          "app.kubernetes.io/name": "netbox-valkey",
          "app.kubernetes.io/managed-by": "Pulumi",
          "k3s.sapslaj.xyz/stack": "nekopara.netbox",
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

const secretKey = new random.RandomPassword("netbox-secret-key", {
  length: 64,
});

const chart = new kubernetes.helm.v4.Chart("netbox", {
  chart: "oci://ghcr.io/netbox-community/netbox-chart/netbox",
  version: "6.1.6",
  namespace: namespace.metadata.name,
  skipCrds: true,
  values: {
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
      host: "netbox-valkey",
    },
    cachingDatabase: {
      host: "netbox-valkey",
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
});
