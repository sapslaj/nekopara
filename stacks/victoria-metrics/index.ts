import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as YAML from "yaml";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { DNSRecord } from "../../components/shimiko";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("victoria-metrics", {
  metadata: {
    name: "victoria-metrics",
  },
}, { provider });

[
  "victoriametrics-vlinsert",
  "victoriametrics-vlselect",
  "victoriametrics-vminsert",
  "victoriametrics-vmselect",
].map((name) => {
  new DNSRecord(name, {
    name,
    type: "CNAME",
    records: ["homelab.sapslaj.com."],
  });
});

const basicAuthUsers = [
  "grafana",
  "remotewrite",
].map((username) => {
  const randomPassword = new random.RandomPassword(username, {
    length: 31,
    special: false,
  });
  new aws.ssm.Parameter(username, {
    type: "SecureString",
    name: `/nekopara/victoria-metrics/ingress-user/${username}/password`,
    value: randomPassword.result,
  });
  return {
    username,
    password: randomPassword.bcryptHash,
  };
}).reduce(
  (obj, { username, password }) => {
    return {
      ...obj,
      [username]: password,
    };
  },
  {} as Record<string, pulumi.Output<string>>,
);

const basicAuthSecret = new kubernetes.core.v1.Secret("victoria-metrics-ingress-basic-auth", {
  metadata: {
    name: "victoria-metrics-ingress-basic-auth",
    namespace: namespace.metadata.name,
  },
  stringData: {
    users: pulumi.concat(
      Object.entries(basicAuthUsers).map(([username, password]) => {
        return [username, ":", password, "\n"];
      }).flat(),
    ),
  },
}, { provider });

const basicAuthMiddleware = new kubernetes.apiextensions.CustomResource("victoria-metrics-ingress-basic-auth", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "victoria-metrics-ingress-basic-auth",
    namespace: namespace.metadata.name,
  },
  spec: {
    basicAuth: {
      secret: basicAuthSecret.metadata.name,
    },
  },
}, { provider });

const victoriaMetricsOperator = new kubernetes.helm.v3.Chart("victoria-metrics-operator", {
  chart: "victoria-metrics-operator",
  fetchOpts: {
    repo: "https://victoriametrics.github.io/helm-charts/",
  },
  version: "0.51.3",
  skipCRDRendering: true,
  namespace: namespace.metadata.name,
  values: {
    image: {
      registry: "quay.io",
    },
    crds: {
      enabled: false,
      plain: false,
      cleanup: {
        enabled: false,
      },
    },
    env: [
      {
        name: "VM_USECUSTOMCONFIGRELOADER",
        value: "true",
      },
      {
        name: "VM_CUSTOMCONFIGRELOADERIMAGE",
        value: "quay.io/victoriametrics/operator:config-reloader-v0.53.0",
      },
      {
        name: "VM_VLOGSDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/victoria-logs",
      },
      {
        name: "VM_VMALERTDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/vmalert",
      },
      {
        name: "VM_VMAGENTDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/vmagent",
      },
      {
        name: "VM_VMSINGLEDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/victoria-metrics",
      },
      {
        name: "VM_VMCLUSTERDEFAULT_VMSELECTDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/vmselect",
      },
      {
        name: "VM_VMCLUSTERDEFAULT_VMSTORAGEDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/vmstorage",
      },
      {
        name: "VM_VMCLUSTERDEFAULT_VMINSERTDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/vminsert",
      },
      {
        name: "VM_VMBACKUP_IMAGE",
        value: "quay.io/victoriametrics/vmbackupmanager",
      },
      {
        name: "VM_VMAUTHDEFAULT_IMAGE",
        value: "quay.io/victoriametrics/vmauth",
      },
      {
        name: "VM_VMALERTMANAGER_ALERTMANAGERDEFAULTBASEIMAGE",
        value: "quay.io/prometheus/alertmanager",
      },
    ],
    serviceMonitor: {
      enabled: true,
    },
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind === "ValidatingWebhookConfiguration") {
        opts.ignoreChanges = [
          ...(opts.ignoreChanges ?? []),
          "webhooks[*].clientConfig.caBundle",
        ];
      }
      if (
        obj.kind === "Secret" && obj.apiVersion === "v1" && obj.metadata.name === "victoria-metrics-operator-validation"
      ) {
        opts.ignoreChanges = [
          ...(opts.ignoreChanges ?? []),
          "data",
        ];
      }
    },
  ],
}, {
  provider,
});

const victoriaMetrics = new kubernetes.helm.v3.Chart("victoria-metrics", {
  chart: "victoria-metrics-k8s-stack",
  fetchOpts: {
    repo: "https://victoriametrics.github.io/helm-charts/",
  },
  version: "0.58.1",
  skipCRDRendering: true,
  namespace: namespace.metadata.name,
  values: {
    nameOverride: "victoria-metrics",
    fullnameOverride: "victoria-metrics",
    "victoria-metrics-operator": {
      enabled: false,
      crds: {
        enabled: false,
        plain: false,
        cleanup: {
          enabled: false,
        },
      },
    },
    defaultDashboards: {
      enabled: true,
      labels: {
        "grafana_dashboard": "1",
      },
    },
    vmsingle: {
      enabled: false,
    },
    vmcluster: {
      enabled: true,
      spec: {
        vmstorage: {
          storage: {
            volumeClaimTemplate: {
              spec: {
                storageClassName: "nfs",
              },
            },
          },
        },
        vmselect: {
          storage: {
            volumeClaimTemplate: {
              spec: {
                storageClassName: "nfs",
              },
            },
          },
        },
      },
      ingress: {
        storage: {
          enabled: false,
        },
        select: {
          enabled: true,
          annotations: {
            "traefik.ingress.kubernetes.io/router.middlewares": pulumi
              .interpolate`${basicAuthMiddleware.metadata.namespace}-${basicAuthMiddleware.metadata.name}@kubernetescrd`,
          },
          ingressClassName: "traefik",
          hosts: [
            "victoriametrics-vmselect.sapslaj.xyz",
          ],
        },
        insert: {
          enabled: true,
          annotations: {
            "traefik.ingress.kubernetes.io/router.middlewares": pulumi
              .interpolate`${basicAuthMiddleware.metadata.namespace}-${basicAuthMiddleware.metadata.name}@kubernetescrd`,
          },
          ingressClassName: "traefik",
          hosts: [
            "victoriametrics-vminsert.sapslaj.xyz",
          ],
        },
      },
    },
    grafana: {
      enabled: false,
      forceDeployDatasource: true,
    },
  },
}, {
  provider,
  dependsOn: [
    victoriaMetricsOperator,
  ],
  transforms: [
    transformSkipIngressAwait(),
  ],
});

const victoriaLogs = new kubernetes.helm.v3.Chart("victoria-logs", {
  chart: "victoria-logs-cluster",
  fetchOpts: {
    repo: "https://victoriametrics.github.io/helm-charts/",
  },
  version: "0.0.8",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    global: {
      image: {
        registry: "quay.io",
      },
    },
    serviceAccount: {
      create: true,
    },
    vlselect: {
      enabled: true,
      podDisruptionBudget: {
        enabled: true,
        minAvailable: 1,
      },
      ingress: {
        enabled: true,
        annotations: {
          "traefik.ingress.kubernetes.io/router.middlewares": pulumi
            .interpolate`${basicAuthMiddleware.metadata.namespace}-${basicAuthMiddleware.metadata.name}@kubernetescrd`,
        },
        hosts: [
          {
            name: "victoriametrics-vlselect.sapslaj.xyz",
            path: [
              "/select",
            ],
            port: "http",
          },
        ],
      },
      vmServiceScrape: {
        enabled: true,
      },
    },
    vlinsert: {
      enabled: true,
      podDisruptionBudget: {
        enabled: true,
        minAvailable: 1,
      },
      ingress: {
        enabled: true,
        annotations: {
          "traefik.ingress.kubernetes.io/router.middlewares": pulumi
            .interpolate`${basicAuthMiddleware.metadata.namespace}-${basicAuthMiddleware.metadata.name}@kubernetescrd`,
        },
        hosts: [
          {
            name: "victoriametrics-vlinsert.sapslaj.xyz",
            path: [
              "/insert",
            ],
            port: "http",
          },
        ],
      },
      vmServiceScrape: {
        enabled: true,
      },
    },
    vlstorage: {
      enabled: true,
      podDisruptionBudget: {
        enabled: true,
        minAvailable: 1,
      },
      persistentVolume: {
        storageClassName: "nfs",
      },
      vmServiceScrape: {
        enabled: true,
      },
    },
    vector: {
      enabled: true,
      tolerations: [
        {
          effect: "NoSchedule",
          key: "k3s.sapslaj.xyz/role",
          operator: "Exists",
        },
      ],
    },
    extraObjects: [
      {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "victoria-logs-grafana-ds",
          labels: {
            grafana_datasource: "1",
          },
        },
        data: {
          "datasource.yaml": YAML.stringify({
            apiVersion: 1,
            datasources: [
              {
                access: "proxy",
                name: "VictoriaLogs",
                type: "victoriametrics-logs-datasource",
                // url: "http://victoria-logs-victoria-logs-single-server.victoria-metrics.svc.cluster.local.:9428",
                url: `{{ include "vm.url" (dict "helm" . "appKey" "vlselect" "style" "plain") }}`,
              },
            ],
          }),
        },
      },
    ],
  },
}, {
  provider,
  dependsOn: [
    victoriaMetricsOperator,
    victoriaMetrics,
  ],
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new kubernetes.apiextensions.CustomResource("static-scrape-node-exporter", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "node-exporter",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "node_exporter",
    targetEndpoints: [
      {
        targets: [
          "aqua.sapslaj.xyz:9100",
          "eris.sapslaj.xyz:9100",
          "playboy.sapslaj.xyz:9100",
          "ram.sapslaj.xyz:9100",
          "rem.sapslaj.xyz:9100",
          "tohru.sapslaj.xyz:9100",
          "koyuki.sapslaj.xyz:9100",
          "mitsuru.sapslaj.xyz:9100",
          "shimiko.sapslaj.xyz:9100",
          "misc.sapslaj.xyz:9100",
          "oci.sapslaj.xyz:9100",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-standalone-docker", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "standalone-docker",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "standalone_docker",
    targetEndpoints: [
      {
        targets: [
          "eris.sapslaj.xyz:9323",
          "koyuki.sapslaj.xyz:9323",
          "oci.sapslaj.xyz:9100",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-standalone-docker-cadvisor", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "standalone-docker-cadvisor",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "standalone_docker",
    targetEndpoints: [
      {
        targets: [
          "eris.sapslaj.xyz:9338",
          "koyuki.sapslaj.xyz:9338",
          "oci.sapslaj.xyz:9100",
        ],
      },
    ],
  },
}, {
  provider,
});

const watchtowerToken = new kubernetes.core.v1.Secret("watchtower-token", {
  metadata: {
    name: "watchtower-token",
    namespace: namespace.metadata.name,
  },
  stringData: {
    // TODO: consider generating a better token
    WATCHTOWER_HTTP_API_TOKEN: "adminadmin",
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-standalone-docker-watchtower", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "standalone-docker-watchtower",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "standalone_docker",
    targetEndpoints: [
      {
        path: "/v1/metrics",
        bearerTokenSecret: {
          name: watchtowerToken.metadata.name,
          key: "WATCHTOWER_HTTP_API_TOKEN",
        },
        targets: [
          "eris.sapslaj.xyz:9420",
          "koyuki.sapslaj.xyz:9420",
          "oci.sapslaj.xyz:9100",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-du", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "du",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "du",
    targetEndpoints: [
      {
        targets: [
          "aqua.sapslaj.xyz:9477",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-libvirt", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "libvirt",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "libvirt",
    targetEndpoints: [
      {
        targets: [
          "aqua.sapslaj.xyz:9177",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-qbittorrent", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "qbittorrent",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "qbittorrent",
    targetEndpoints: [
      {
        interval: "10m",
        scrapeTimeout: "10m",
        targets: [
          "koyuki.sapslaj.xyz:9365",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-adguard", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "adguard",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "adguard",
    targetEndpoints: [
      {
        targets: [
          "rem.sapslaj.xyz:9617",
          "ram.sapslaj.xyz:9617",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-coredns", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "coredns",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "coredns",
    targetEndpoints: [
      {
        targets: [
          "rem.sapslaj.xyz:9153",
          "ram.sapslaj.xyz:9153",
        ],
      },
    ],
  },
}, {
  provider,
});

const hassTokenState = new random.RandomPassword("hass-token", {
  length: 1,
}, {
  ignoreChanges: ["*"],
});

const hassToken = new kubernetes.core.v1.Secret("hass-token", {
  metadata: {
    name: "hass-token",
    namespace: namespace.metadata.name,
  },
  stringData: {
    HASS_TOKEN: hassTokenState.result,
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-homeassistant", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "homeassistant",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "homeassistant",
    targetEndpoints: [
      {
        path: "/v1/metrics",
        bearerTokenSecret: {
          name: hassToken.metadata.name,
          key: "HASS_TOKEN",
        },
        targets: [
          "homeassistant.sapslaj.xyz:8123",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-morbius", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "morbius",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "morbius",
    targetEndpoints: [
      {
        targets: [
          "koyuki.sapslaj.xyz:9269",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("static-scrape-zonepop", {
  apiVersion: "operator.victoriametrics.com/v1beta1",
  kind: "VMStaticScrape",
  metadata: {
    name: "zonepop",
    namespace: namespace.metadata.name,
  },
  spec: {
    jobName: "zonepop",
    targetEndpoints: [
      {
        targets: [
          "shimiko.sapslaj.xyz:9412",
        ],
      },
    ],
  },
}, {
  provider,
});

new kubernetes.helm.v3.Chart("blackbox-exporter", {
  chart: "prometheus-blackbox-exporter",
  fetchOpts: {
    repo: "https://prometheus-community.github.io/helm-charts",
  },
  version: "7.6.1",
  skipCRDRendering: true,
  namespace: namespace.metadata.name,
  values: {
    config: {
      modules: {
        http_2xx: {
          prober: "http",
          http: {
            preferred_ip_protocol: "ip4",
          },
        },
        http_2xx_nosslverify: {
          prober: "http",
          http: {
            tls_config: {
              insecure_skip_verify: true,
            },
            preferred_ip_protocol: "ip4",
          },
        },
        http_post_2xx: {
          prober: "http",
          http: {
            method: "POST",
            preferred_ip_protocol: "ip4",
          },
        },
        tcp_connect: {
          prober: "tcp",
          tcp: {
            preferred_ip_protocol: "ip4",
          },
        },
        icmp: {
          prober: "icmp",
          icmp: {
            preferred_ip_protocol: "ip4",
          },
        },
        ssh_banner: {
          prober: "tcp",
          tcp: {
            query_response: [
              {
                expect: "^SSH-2.0-",
              },
              {
                send: "SSH-2.0-blackbox-ssh-check",
              },
            ],
            preferred_ip_protocol: "ip4",
          },
        },
      },
    },
    ingress: {
      // enabled: true,
      // hosts: [
      //   {
      //     host: "blackbox-exporter.sapslaj.xyz",
      //     paths: [
      //       {
      //         path: "/",
      //         pathType: "ImplementationSpecific",
      //       },
      //     ],
      //   },
      // ],
    },
    serviceMonitor: {
      selfMonitor: {
        enabled: true,
      },
      enabled: true,
      targets: [
        {
          name: "unifi-webui",
          url: "https://unifi.sapslaj.com:8443",
          module: "http_2xx",
        },
        {
          name: "omada-webui",
          url: "https://omada.direct.sapslaj.cloud:8043",
          module: "http_2xx_nosslverify",
        },
        {
          name: "yor-ssh",
          url: "yor.sapslaj.xyz:22",
          module: "ssh_banner",
        },
        {
          name: "daki-ssh",
          url: "daki.sapslaj.xyz:22",
          module: "ssh_banner",
        },
        {
          name: "shiroko-ssh",
          url: "shiroko.sapslaj.xyz:22",
          module: "ssh_banner",
        },
        {
          name: "homeassistant-webui",
          url: "http://homeassistant.sapslaj.xyz:8123",
          module: "http_2xx",
        },
        {
          name: "plex-tcp",
          url: "koyuki.sapslaj.xyz:32400",
          module: "tcp_connect",
        },
        {
          name: "jellyfin-webui",
          url: "http://koyuki.sapslaj.xyz:8096",
          module: "http_2xx_nosslverify",
        },
        {
          name: "grafana",
          url: "https://grafana.sapslaj.cloud",
          module: "http_2xx",
        },
        {
          name: "aqualist",
          url: "https://aqualist.sapslaj.com",
          module: "http_2xx",
        },
        {
          name: "google-https",
          url: "https://www.google.com",
          module: "http_2xx",
        },
      ],
    },
  },
}, {
  provider,
});

// new kubernetes.helm.v3.Chart("snmp-exporter", {
//   chart: "prometheus-snmp-exporter",
//   fetchOpts: {
//     repo: "https://prometheus-community.github.io/helm-charts",
//   },
//   version: "9.6.1",
//   skipCRDRendering: true,
//   namespace: namespace.metadata.name,
//   values: {
//     serviceMonitor: {
//       scrapeTimeout: "60s",
//       module: [
//         "if_mib",
//         "system",
//       ],
//       params: [
//         {
//           name: "daki",
//           target: "daki.sapslaj.xyz",
//           module: [
//             "if_mib",
//             "mikrotik",
//             "system",
//           ],
//         },
//         {
//           name: "oap1",
//           target: "oap1.sapslaj.xyz",
//         },
//         {
//           name: "oap2",
//           target: "oap2.sapslaj.xyz",
//         },
//         // TODO:
//         // {
//         //   name: "oap3",
//         //   target: "oap3.sapslaj.xyz",
//         // },
//         {
//           name: "osw1",
//           target: "osw1.sapslaj.xyz",
//         },
//         {
//           name: "osw2",
//           target: "osw2.sapslaj.xyz",
//         },
//         {
//           name: "osw3",
//           target: "osw3.sapslaj.xyz",
//         },
//         {
//           name: "pdu1",
//           target: "pdu1.sapslaj.xyz",
//           module: [
//             "cyberpower",
//             "if_mib",
//             "system",
//             "ups_mib",
//           ],
//         },
//         {
//           name: "pdu2",
//           target: "pdu2.sapslaj.xyz",
//           module: [
//             "cyberpower",
//             "if_mib",
//             "system",
//             "ups_mib",
//           ],
//         },
//         {
//           name: "shiroko",
//           target: "shiroko.sapslaj.xyz",
//           module: [
//             "if_mib",
//             "mikrotik",
//             "system",
//           ],
//         },
//         {
//           name: "ups1",
//           target: "ups1.sapslaj.xyz",
//           module: [
//             "cyberpower",
//             "if_mib",
//             "ups_mib",
//             "system",
//           ],
//         },
//         // TODO:
//         // {
//         //   name: "ups2",
//         //   target: "ups2.sapslaj.xyz",
//         // },
//         // TODO:
//         // {
//         //   name: "ups3",
//         //   target: "ups3.sapslaj.xyz",
//         // },
//         {
//           name: "yor",
//           target: "yor.sapslaj.xyz",
//         },
//       ],
//       enabled: true,
//       selfMonitor: {
//         enabled: true,
//       },
//     },
//   },
// }, {
//   provider,
// });
