import * as kubernetes from "@pulumi/kubernetes";

import { getSecretValueOutput, projectSlugs } from "../../components/infisical";
import { newK3sProvider } from "../../components/k3s-shared";

// NOTE: using internal cluster endpoint instead of public one for funsies
// const hostAPI = "https://infisical.sapslaj.cloud";
const hostAPI = "http://infisical.infisical.svc.cluster.local:80";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("infisical-operator-system", {
  metadata: {
    name: "infisical-operator-system",
  },
}, { provider });

new kubernetes.helm.v3.Chart("infisical-secrets-operator", {
  chart: "secrets-operator",
  fetchOpts: {
    repo: "https://dl.cloudsmith.io/public/infisical/helm-charts/helm/charts/",
  },
  version: "0.10.3",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    controllerManager: {
      manager: {
        args: [
          "--metrics-bind-address=:8080",
          "--metrics-secure=false",
          "--leader-elect",
          "--health-probe-bind-address=:8081",
        ],
        image: {
          repository: "proxy.oci.sapslaj.xyz/docker-hub/infisical/kubernetes-operator",
        },
      },
    },
    metricsService: {
      ports: [
        {
          name: "http",
          port: 8080,
          protocol: "TCP",
          targetPort: 8080,
        },
      ],
    },
    installCRDs: false,
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("infisical-secrets-operator-servicemonitor", {
  apiVersion: "monitoring.coreos.com/v1",
  kind: "ServiceMonitor",
  metadata: {
    name: "infisical-secrets-operator",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "infisical-secrets-operator",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical-secrets-operator",
    },
  },
  spec: {
    selector: {
      matchLabels: {
        "control-plane": "controller-manager",
        "app.kubernetes.io/name": "secrets-operator",
        "app.kubernetes.io/instance": "infisical-secrets-operator",
      },
    },
    endpoints: [
      {
        port: "http",
        interval: "30s",
        scrapeTimeout: "10s",
        path: "/metrics",
      },
    ],
  },
}, { provider });

new kubernetes.core.v1.ConfigMap("infisical-config", {
  metadata: {
    name: "infisical-config",
    namespace: namespace.metadata.name,
  },
  data: {
    hostAPI,
  },
}, { provider });

// this is technically for ESO but whatever
const esoSecret = new kubernetes.core.v1.Secret("infisical-eso", {
  metadata: {
    name: "infisical",
    namespace: "external-secrets-operator",
  },
  type: "Opaque",
  stringData: {
    clientId: getSecretValueOutput({
      folder: "/infisical",
      key: "INFISICAL_CLIENT_ID",
    }),
    clientSecret: getSecretValueOutput({
      folder: "/infisical",
      key: "INFISICAL_CLIENT_SECRET",
    }),
  },
}, { provider });

new kubernetes.apiextensions.CustomResource("cluster-secret-store-infisical-homelab-prod", {
  apiVersion: "external-secrets.io/v1",
  kind: "ClusterSecretStore",
  metadata: {
    name: "infisical-homelab-prod",
  },
  spec: {
    provider: {
      infisical: {
        hostAPI,
        auth: {
          universalAuthCredentials: {
            clientId: {
              key: "clientId",
              namespace: esoSecret.metadata.namespace,
              name: esoSecret.metadata.name,
            },
            clientSecret: {
              key: "clientSecret",
              namespace: esoSecret.metadata.namespace,
              name: esoSecret.metadata.name,
            },
          },
        },
        secretsScope: {
          projectSlug: projectSlugs.homelab,
          environmentSlug: "prod",
        },
      },
    },
  },
}, { provider });

new kubernetes.apiextensions.CustomResource("cluster-secret-store-infisical-homelab-dev", {
  apiVersion: "external-secrets.io/v1",
  kind: "ClusterSecretStore",
  metadata: {
    name: "infisical-homelab-dev",
  },
  spec: {
    provider: {
      infisical: {
        hostAPI,
        auth: {
          universalAuthCredentials: {
            clientId: {
              key: "clientId",
              namespace: esoSecret.metadata.namespace,
              name: esoSecret.metadata.name,
            },
            clientSecret: {
              key: "clientSecret",
              namespace: esoSecret.metadata.namespace,
              name: esoSecret.metadata.name,
            },
          },
        },
        secretsScope: {
          projectSlug: projectSlugs.homelab,
          environmentSlug: "dev",
        },
      },
    },
  },
}, { provider });
