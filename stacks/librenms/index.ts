import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("librenms", {
  metadata: {
    name: "librenms",
  },
}, { provider });

const valkey = new Valkey("librenms-valkey", {
  name: "librenms-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/component": "valkey",
    "app.kubernetes.io/instance": "librenms-valkey",
    "app.kubernetes.io/name": "librenms-valkey",
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.librenms",
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

const dbPassword = new random.RandomPassword("db-password", {
  length: 16,
  lower: true,
  number: true,
  numeric: true,
  special: true,
  upper: true,
});

const dbPVC = new kubernetes.core.v1.PersistentVolumeClaim("librenms-db", {
  metadata: {
    name: "librenms-db",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "db",
      "app.kubernetes.io/instance": "librenms-db",
      "app.kubernetes.io/name": "librenms-db",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
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
}, { provider });

const dbService = new kubernetes.core.v1.Service("librenms-db", {
  metadata: {
    name: "librenms-db",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "db",
      "app.kubernetes.io/instance": "librenms-db",
      "app.kubernetes.io/name": "librenms-db",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    selector: {
      "app.kubernetes.io/component": "db",
      "app.kubernetes.io/instance": "librenms-db",
      "app.kubernetes.io/name": "librenms-db",
    },
    ports: [
      {
        port: 3306,
      },
    ],
  },
}, { provider });

const db = new kubernetes.apps.v1.StatefulSet("librenms-db", {
  metadata: {
    name: "librenms-db",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "db",
      "app.kubernetes.io/instance": "librenms-db",
      "app.kubernetes.io/name": "librenms-db",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    replicas: 1,
    serviceName: dbService.metadata.name,
    selector: {
      matchLabels: dbService.spec.selector,
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "db",
          "app.kubernetes.io/instance": "librenms-db",
          "app.kubernetes.io/name": "librenms-db",
          "app.kubernetes.io/managed-by": "Pulumi",
          "k3s.sapslaj.xyz/stack": "nekopara.librenms",
        },
      },
      spec: {
        volumes: [
          {
            name: "db",
            persistentVolumeClaim: {
              claimName: dbPVC.metadata.name,
            },
          },
        ],
        containers: [
          {
            name: "mariadb",
            image: "proxy.oci.sapslaj.xyz/docker-hub/mariadb:10.5",
            args: [
              "mysqld",
              "--innodb-file-per-table=1",
              "--lower-case-table-names=0",
              "--character-set-server=utf8mb4",
              "--collation-server=utf8mb4_unicode_ci",
            ],
            ports: [
              {
                containerPort: 3306,
              },
            ],
            volumeMounts: [
              {
                name: "db",
                mountPath: "/var/lib/mysql",
              },
            ],
            env: [
              {
                name: "MYSQL_ALLOW_EMPTY_PASSWORD",
                value: "yes",
              },
              {
                name: "MYSQL_DATABASE",
                value: "librenms",
              },
              {
                name: "MYSQL_USER",
                value: "librenms",
              },
              {
                // yikes.
                name: "MYSQL_PASSWORD",
                value: dbPassword.result,
              },
            ],
          },
        ],
      },
    },
  },
}, { provider });

const pushGatewayService = new kubernetes.core.v1.Service("librenms-prometheus-pushgateway", {
  metadata: {
    name: "librenms-prometheus-pushgateway",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "prometheus-pushgateway",
      "app.kubernetes.io/instance": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/name": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    selector: {
      "app.kubernetes.io/component": "prometheus-pushgateway",
      "app.kubernetes.io/instance": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/name": "librenms-prometheus-pushgateway",
    },
    ports: [
      {
        port: 9091,
        name: "http",
      },
    ],
  },
}, { provider });

const pushGateway = new kubernetes.apps.v1.Deployment("librenms-prometheus-pushgateway", {
  metadata: {
    name: "librenms-prometheus-pushgateway",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "prometheus-pushgateway",
      "app.kubernetes.io/instance": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/name": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: pushGatewayService.spec.selector,
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "prometheus-pushgateway",
          "app.kubernetes.io/instance": "librenms-prometheus-pushgateway",
          "app.kubernetes.io/name": "librenms-prometheus-pushgateway",
          "app.kubernetes.io/managed-by": "Pulumi",
          "k3s.sapslaj.xyz/stack": "nekopara.librenms",
        },
      },
      spec: {
        containers: [
          {
            name: "pushgateway",
            image: "proxy.oci.sapslaj.xyz/docker-hub/prom/pushgateway:latest",
            ports: [
              {
                name: "http",
                containerPort: 9091,
              },
            ],
          },
          {
            name: "cleaner",
            image: "proxy.oci.sapslaj.xyz/docker-hub/jorinvo/prometheus-pushgateway-cleaner",
            args: [
              "--report-metrics",
              "--metric-url",
              "http://localhost:9091/metrics/",
              "--expiration-in-minutes",
              "10",
              "--interval-in-minutes",
              "5",
            ],
          },
        ],
      },
    },
  },
}, { provider });

new kubernetes.apiextensions.CustomResource("librenms-prometheus-pushgateway-servicemonitor", {
  apiVersion: "monitoring.coreos.com/v1",
  kind: "ServiceMonitor",
  metadata: {
    name: "librenms-prometheus-pushgateway",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "prometheus-pushgateway",
      "app.kubernetes.io/instance": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/name": "librenms-prometheus-pushgateway",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    selector: {
      matchLabels: pushGatewayService.spec.selector,
    },
    namespaceSelector: {
      matchNames: [
        namespace.metadata.name,
      ],
    },
    endpoints: [
      {
        port: "http",
        metricRelabelings: [
          {
            sourceLabels: ["exported_instance"],
            targetLabel: "instance",
          },
          {
            sourceLabels: ["exported_job"],
            targetLabel: "job",
          },
          {
            regex: "exported_(instance|job)",
            action: "labeldrop",
          },
        ],
      },
    ],
  },
}, { provider });

const dataPVC = new kubernetes.core.v1.PersistentVolumeClaim("librenms-data", {
  metadata: {
    name: "librenms-data",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "data",
      "app.kubernetes.io/instance": "librenms-data",
      "app.kubernetes.io/name": "librenms-data",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
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
}, { provider });

const appEnv = new kubernetes.core.v1.ConfigMap("librenms-app-env", {
  metadata: {
    name: "librenms-app-env",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "app-env",
      "app.kubernetes.io/instance": "librenms-app-env",
      "app.kubernetes.io/name": "librenms-app-env",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  data: {
    DB_HOST: dbService.metadata.name,
    DB_NAME: "librenms",
    DB_USER: "librenms",
    // yikes.
    DB_PASSWORD: dbPassword.result,
    REDIS_HOST: valkey.readWriteService.metadata.name,
    REDIS_PORT: "6379",
    REDIS_DB: "0",
  },
}, { provider });

const appService = new kubernetes.core.v1.Service("librenms", {
  metadata: {
    name: "librenms",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "librenms",
      "app.kubernetes.io/name": "librenms",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    selector: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "librenms",
      "app.kubernetes.io/name": "librenms",
    },
    ports: [
      {
        port: 8000,
      },
    ],
  },
}, { provider });

const app = new kubernetes.apps.v1.StatefulSet("librenms", {
  metadata: {
    name: "librenms",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "app",
      "app.kubernetes.io/instance": "librenms",
      "app.kubernetes.io/name": "librenms",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
  },
  spec: {
    replicas: 1,
    serviceName: appService.metadata.name,
    selector: {
      matchLabels: appService.spec.selector,
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "app",
          "app.kubernetes.io/instance": "librenms",
          "app.kubernetes.io/name": "librenms",
          "app.kubernetes.io/managed-by": "Pulumi",
          "k3s.sapslaj.xyz/stack": "nekopara.librenms",
        },
      },
      spec: {
        volumes: [
          {
            name: "data",
            persistentVolumeClaim: {
              claimName: dataPVC.metadata.name,
            },
          },
        ],
        containers: [
          {
            name: "librenms",
            image: "proxy.oci.sapslaj.xyz/docker-hub/librenms/librenms:latest",
            ports: [
              {
                containerPort: 8000,
              },
            ],
            envFrom: [
              {
                configMapRef: {
                  name: appEnv.metadata.name,
                },
              },
            ],
            securityContext: {
              capabilities: {
                add: [
                  "NET_ADMIN",
                  "NET_RAW",
                ],
              },
            },
            volumeMounts: [
              {
                name: "data",
                mountPath: "/data",
              },
            ],
          },
          {
            name: "dispatcher",
            image: "proxy.oci.sapslaj.xyz/docker-hub/librenms/librenms:latest",
            env: [
              {
                name: "SIDECAR_DISPATCHER",
                value: "1",
              },
            ],
            envFrom: [
              {
                configMapRef: {
                  name: appEnv.metadata.name,
                },
              },
            ],
            securityContext: {
              capabilities: {
                add: [
                  "NET_ADMIN",
                  "NET_RAW",
                ],
              },
            },
            volumeMounts: [
              {
                name: "data",
                mountPath: "/data",
              },
            ],
          },
        ],
      },
    },
  },
}, { provider });

const allowList = new kubernetes.apiextensions.CustomResource("librenms-ipallowlist", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "librenms-ipallowlist",
    namespace: namespace.metadata.name,
  },
  spec: {
    ipAllowList: {
      sourceRange: [
        "172.24.4.0/24",
        "172.24.5.0/24",
      ],
    },
  },
}, { provider });

new kubernetes.networking.v1.Ingress("librenms", {
  metadata: {
    name: "librenms",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "ingress",
      "app.kubernetes.io/instance": "librenms",
      "app.kubernetes.io/name": "librenms",
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.librenms",
    },
    annotations: {
      "pulumi.com/skipAwait": "true",
      "traefik.ingress.kubernetes.io/router.middlewares": pulumi
        .interpolate`${allowList.metadata.namespace}-${allowList.metadata.name}@kubernetescrd`,
    },
  },
  spec: {
    rules: [
      {
        host: "librenms.sapslaj.xyz",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: appService.metadata.name,
                  port: {
                    number: 8000,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("librenms.sapslaj.xyz", {
  hostname: "librenms.sapslaj.xyz",
}, {
  providers: {
    kubernetes: provider,
  },
});
