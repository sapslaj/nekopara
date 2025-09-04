import * as kubernetes from "@pulumi/kubernetes";
import * as YAML from "yaml";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { AuthentikProxyIngress } from "../../components/k8s/AuthentikProxyIngress";
import { IngressDNS } from "../../components/k8s/IngressDNS";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("jaeger", {
  metadata: {
    name: "jaeger",
  },
}, { provider });

const opensearch = new kubernetes.apiextensions.CustomResource("jaeger-opensearch", {
  apiVersion: "opensearch.opster.io/v1",
  kind: "OpenSearchCluster",
  metadata: {
    name: "jaeger-opensearch",
    namespace: namespace.metadata.name,
    annotations: {
      "pulumi.com/patchForce": "true",
    },
  },
  spec: {
    general: {
      image: "public.ecr.aws/opensearchproject/opensearch:2.3.0",
      vendor: "Opensearch",
      version: "2.3.0",
      serviceName: "jaeger-opensearch",
      drainDataNodes: true,
      monitoring: {
        enable: true,
      },
      disableSSL: true,
    },
    dashboards: {
      enable: false,
      replicas: 0,
      version: "",
    },
    nodePools: [
      {
        component: "main",
        replicas: 3,
        diskSize: "100Gi",
        roles: [
          "master",
          "data",
        ],
        resources: {
          requests: {
            memory: "8Gi",
            cpu: "2",
          },
          limits: {
            memory: "8Gi",
            cpu: "2",
          },
        },
        persistence: {
          pvc: {
            storageClass: "shortrack-mitsuru-red",
            accessModes: [
              "ReadWriteOnce",
            ],
          },
        },
        env: [
          {
            name: "plugins.security.disabled",
            value: "true",
          },
        ],
      },
    ],
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("jaeger", {
  chart: "jaeger",
  fetchOpts: {
    repo: "https://jaegertracing.github.io/helm-charts",
  },
  version: "3.4.1",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    provisionDataStore: {
      cassandra: false,
      elasticsearch: false,
      kafka: false,
    },
    storage: {
      type: "elasticsearch",
      elasticsearch: {
        host: "jaeger-opensearch",
        anonymous: true,
      },
    },
    agent: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
      serviceMonitor: {
        enabled: true,
      },
    },
    collector: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
      extraEnv: [
        {
          name: "JAEGER_LOG_LEVEL",
          value: "debug",
        },
      ],
      service: {
        otlp: {
          grpc: {
            name: "otlp-grpc",
            port: 4317,
          },
          http: {
            name: "otlp-http",
            port: 4318,
          },
        },
      },
      ingress: {
        enabled: true,
        ingressClassName: "traefik",
        annotations: {
          "traefik.ingress.kubernetes.io/router.middlewares":
            "victoria-metrics-victoria-metrics-ingress-basic-auth@kubernetescrd",
        },
        hosts: [
          {
            host: "jaeger-collector-otlp-grpc.sapslaj.xyz",
            servicePort: "otlp-grpc",
          },
          {
            host: "jaeger-collector-otlp-http.sapslaj.xyz",
            servicePort: "otlp-http",
          },
        ],
      },
      serviceMonitor: {
        enabled: true,
      },
    },
    query: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
      serviceMonitor: {
        enabled: true,
      },
    },
    esIndexCleaner: {
      enabled: true,
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
    },
    extraObjects: [
      {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "jaeger-grafana-ds",
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
                name: "Jaeger",
                type: "jaeger",
                url: `http://{{ template "jaeger.query.name" . }}.{{ .Release.Namespace }}.svc.cluster.local:80`,
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
    opensearch,
  ],
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("jaeger-collector-otlp-grpc.sapslaj.xyz", {}, {
  providers: {
    kubernetes: provider,
  },
});

new IngressDNS("jaeger-collector-otlp-http.sapslaj.xyz", {}, {
  providers: {
    kubernetes: provider,
  },
});

new AuthentikProxyIngress("jaeger-ui", {
  name: "Jaeger",
  namespace: namespace.metadata.name,
  hostname: "jaeger.sapslaj.xyz",
  service: {
    kind: "Service",
    name: "jaeger-query",
    port: 80,
  },
  enableAnubis: false,
}, {
  providers: {
    kubernetes: provider,
  },
});
