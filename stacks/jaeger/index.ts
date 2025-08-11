import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as YAML from "yaml";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";

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
      image: "docker.io/opensearchproject/opensearch:2.3.0",
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
            memory: "2Gi",
            cpu: "2",
          },
          limits: {
            memory: "2Gi",
            cpu: "2",
          },
        },
        persistence: {
          pvc: {
            storageClass: "shortrack-aqua-exos",
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
      serviceMonitor: {
        enabled: true,
      },
    },
    collector: {
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
      serviceMonitor: {
        enabled: true,
      },
    },
    esIndexCleaner: {
      enabled: true,
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
  transforms: [
    transformSkipIngressAwait(),
  ],
});
