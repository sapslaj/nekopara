import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as std from "@pulumi/std";
import * as YAML from "yaml";

import { getDnsFullName, getDnsHostName, newK3sProvider } from "../../components/k3s-shared";
import { DNSRecord } from "../../components/shimiko/DNSRecord";
import * as authentik from "../../sdks/authentik";

const provider = newK3sProvider();
const dnsFullName = getDnsFullName();
const dnsHostName = getDnsHostName();

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
            image: "oxidized/oxidized:0.29.0",
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

const authentikProvider = new authentik.ProviderProxy("oxidized", {
  name: "Oxidized",
  mode: "forward_single",
  externalHost: "https://oxidized.sapslaj.xyz",
  authorizationFlow: authentik.getFlowOutput({
    slug: "default-provider-authorization-implicit-consent",
  }).id,
  invalidationFlow: authentik.getFlowOutput({
    slug: "default-provider-invalidation-flow",
  }).id,
});

const authentikApplication = new authentik.Application("oxidized", {
  name: "Oxidized",
  slug: "oxidized",
  protocolProvider: authentikProvider.providerProxyId.apply((id) => parseInt(id)),
});

const authentikOutpost = new authentik.Outpost("oxidized", {
  name: "Oxidized",
  protocolProviders: [
    authentikProvider.providerProxyId.apply((id) => parseInt(id)),
  ],
  type: "proxy",
  serviceConnection: authentik.getServiceConnectionKubernetesOutput({
    name: "Local Kubernetes Cluster",
  }).id,
  config: std.jsonencodeOutput({
    input: {
      authentik_host: "https://login.sapslaj.cloud",
      kubernetes_namespace: "authentik",
    },
  }).result,
});

const forwardAuthMiddleware = new kubernetes.apiextensions.CustomResource("authentik-forward-auth", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "authentik-forward-auth",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "oxidized",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "oxidized",
      "app.kubernetes.io/name": "authentik-forward-auth",
      "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
    },
  },
  spec: {
    forwardAuth: {
      address: "http://ak-outpost-oxidized.authentik.svc.cluster.local:9000/outpost.goauthentik.io/auth/traefik",
      trustForwardHeader: true,
      authResponseHeaders: [
        "X-authentik-username",
        "X-authentik-groups",
        "X-authentik-entitlements",
        "X-authentik-email",
        "X-authentik-name",
        "X-authentik-uid",
        "X-authentik-jwt",
        "X-authentik-meta-jwks",
        "X-authentik-meta-outpost",
        "X-authentik-meta-provider",
        "X-authentik-meta-app",
        "X-authentik-meta-version",
      ],
    },
  },
}, { provider });

new kubernetes.apiextensions.CustomResource("oxidized-ingressroute", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "IngressRoute",
  metadata: {
    name: "oxidized",
    namespace: namespace.metadata.name,
  },
  spec: {
    routes: [
      {
        match: "Host(`oxidized.sapslaj.xyz`)",
        kind: "Rule",
        middlewares: [
          {
            name: forwardAuthMiddleware.metadata.name,
            namespace: forwardAuthMiddleware.metadata.namespace,
          },
        ],
        priority: 10,
        services: [
          {
            name: service.metadata.name,
            kind: "Service",
            port: 8888,
          },
        ],
      },
      {
        match: "Host(`oxidized.sapslaj.xyz`) && PathPrefix(`/outpost.goauthentik.io/`)",
        kind: "Rule",
        priority: 15,
        services: [
          {
            name: "ak-outpost-oxidized",
            namespace: "authentik",
            kind: "Service",
            port: 9000,
          },
        ],
      },
    ],
  },
}, {
  provider,
});

// const ingress = new kubernetes.networking.v1.Ingress("oxidized", {
//   metadata: {
//     name: "oxidized",
//     namespace: namespace.metadata.name,
//     labels: {
//       "app.kubernetes.io/component": "oxidized",
//       "app.kubernetes.io/managed-by": "Pulumi",
//       "app.kubernetes.io/part-of": "oxidized",
//       "app.kubernetes.io/name": "oxidized",
//       "k3s.sapslaj.xyz/stack": "nekopara.oxidized",
//     },
//   },
//   spec: {
//     rules: [
//       {
//         host: "oxidized.sapslaj.xyz",
//         http: {
//           paths: [
//             {
//               path: "/",
//               pathType: "Prefix",
//               backend: {
//                 service: {
//                   name: service.metadata.name,
//                   port: {
//                     number: 8888,
//                   },
//                 },
//               },
//             },
//           ],
//         },
//       },
//     ],
//   },
// });

const dns = new DNSRecord("oxidized", {
  name: "oxidized",
  records: ["homelab.sapslaj.com."],
  type: "CNAME",
});
