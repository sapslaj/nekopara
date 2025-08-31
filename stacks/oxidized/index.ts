import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as std from "@pulumi/std";
import * as YAML from "yaml";

import { newK3sProvider } from "../../components/k3s-shared";
import { AuthentikProxyIngress } from "../../components/k8s/AuthentikProxyIngress";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("oxidized", {
  metadata: {
    name: "oxidized",
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "oxidized",
      "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
    },
  },
}, { provider });

const password = new random.RandomPassword("oxidized", {
  length: 16,
  lower: true,
  number: true,
  numeric: true,
  special: true,
  upper: true,
});

const pvc = new kubernetes.core.v1.PersistentVolumeClaim("oxidized-data", {
  metadata: {
    name: "oxidized-data",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "oxidized",
      "app.kubernetes.io/name": "oxidized-data",
      "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
    },
  },
  spec: {
    storageClassName: "nfs",
    accessModes: ["ReadWriteMany"],
    resources: {
      requests: {
        storage: "4Gi",
      },
    },
  },
}, { provider });

const config = new kubernetes.core.v1.ConfigMap("oxidized-config", {
  metadata: {
    name: "oxidized-config",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "oxidized",
      "app.kubernetes.io/name": "oxidized-config",
      "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
    },
  },
  data: {
    config: password.result.apply((password) =>
      YAML.stringify({
        crash: {
          directory: "/root/.config/oxidized/crash",
          hostnames: false,
        },
        debug: false,
        group_map: {},
        groups: {},
        input: {
          debug: false,
          default: "ssh, telnet",
          ftp: {
            passive: true,
          },
          ssh: {
            secure: false,
          },
          utf8_encoded: true,
        },
        interval: 3600,
        model: "junos",
        model_map: {
          cisco: "ios",
          juniper: "junos",
        },
        models: {},
        next_adds_job: false,
        output: {
          default: "git",
          file: {
            directory: "/data/configs",
          },
          git: {
            email: "oxidized@sapslaj.com",
            repo: "/data/git-repos/oxidized.git",
            user: "Oxidized",
          },
        },
        password: password,
        pid: "/run/oxidized.pid",
        resolve_dns: true,
        rest: "0.0.0.0:8888",
        retries: 3,
        source: {
          csv: {
            delimiter: ":",
            file: "/config/routers.db",
            map: {
              model: 1,
              name: 0,
            },
          },
          default: "csv",
        },
        stats: {
          history_size: 10,
        },
        threads: 30,
        timeout: 20,
        use_max_threads: false,
        use_syslog: false,
        username: "oxidized",
        vars: {},
      })
    ),
    "routers.db": [
      "yor.sapslaj.xyz:vyatta",
      "daki.sapslaj.xyz:routeros",
      "shiroko.sapslaj.xyz:routeros",
      "",
    ].join("\n"),
  },
}, { provider });

const deployment = new kubernetes.apps.v1.Deployment("oxidized", {
  metadata: {
    name: "oxidized",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "oxidized",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "oxidized",
      "app.kubernetes.io/name": "oxidized",
      "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        "app.kubernetes.io/component": "oxidized",
        "app.kubernetes.io/part-of": "oxidized",
        "app.kubernetes.io/name": "oxidized",
      },
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "oxidized",
          "app.kubernetes.io/part-of": "oxidized",
          "app.kubernetes.io/name": "oxidized",
          "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
        },
      },
      spec: {
        volumes: [
          {
            name: "data",
            persistentVolumeClaim: {
              claimName: pvc.metadata.name,
            },
          },
          {
            name: "config",
            configMap: {
              name: config.metadata.name,
            },
          },
          {
            name: "logs",
            emptyDir: {},
          },
          {
            name: "crashes",
            emptyDir: {},
          },
        ],
        containers: [
          {
            name: "oxidized",
            image: "proxy.oci.sapslaj.xyz/docker-hub/oxidized/oxidized:0.29.0",
            args: [
              "oxidized",
            ],
            volumeMounts: [
              {
                name: "data",
                mountPath: "/data",
              },
              {
                name: "config",
                mountPath: "/config",
              },
              {
                name: "logs",
                mountPath: "/logs",
              },
              {
                name: "crashes",
                mountPath: "/root/.config/oxidized/crash",
              },
            ],
            ports: [
              {
                name: "http",
                containerPort: 8888,
                protocol: "TCP",
              },
            ],
            env: [
              {
                name: "OXIDIZED_HOME",
                value: "/config",
              },
              {
                name: "OXIDIZED_LOGS",
                value: "/logs",
              },
              {
                name: "CONFIG_HASH",
                value: std.md5Output({
                  input: std.jsonencodeOutput({
                    input: config.data,
                  }).result,
                }).result,
              },
            ],
          },
        ],
      },
    },
  },
}, { provider });

const service = new kubernetes.core.v1.Service("oxidized", {
  metadata: {
    name: "oxidized",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "oxidized",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "oxidized",
      "app.kubernetes.io/name": "oxidized",
      "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
    },
  },
  spec: {
    selector: deployment.spec.selector.matchLabels,
    ports: [
      {
        port: 8888,
      },
    ],
  },
}, { provider });

new AuthentikProxyIngress("oxidized", {
  name: "Oxidized",
  namespace: namespace.metadata.name,
  hostname: "oxidized.sapslaj.xyz",
  service: {
    kind: "Service",
    name: service.metadata.name,
    port: 8888,
  },
  enableAnubis: false,
}, {
  providers: {
    kubernetes: provider,
  },
});
