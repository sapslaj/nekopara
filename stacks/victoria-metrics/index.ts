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
      ...Object.entries(basicAuthUsers).map(([username, password]) => {
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
          "playboy.sapslaj.xyz:9100",
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
        path: "/api/prometheus",
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
