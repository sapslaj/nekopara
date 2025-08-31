import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";
import * as infisical from "../../sdks/infisical";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("infisical-secrets-operator", {
  metadata: {
    name: "infisical-secrets-operator",
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("infisical-secrets-operator", {
  chart: "secrets-operator",
  fetchOpts: {
    repo: "https://dl.cloudsmith.io/public/infisical/helm-charts/helm/charts/",
  },
  version: "0.10.3",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    installCRDs: false,
  },
}, {
  provider,
});

new kubernetes.apiextensions.CustomResource("infisical-secrets-operator-servicemonitor", {
  apiVersion: "monitoring.coreos.com/v1",
  kind: "ServiceMonitor",
  metadata: {
    name: "anubis",
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
        port: "https",
        interval: "30s",
        scrapeTimeout: "10s",
        path: "/metrics",
        bearerTokenFile: "/var/run/secrets/kubernetes.io/serviceaccount/token",
        tlsConfig: {
          insecureSkipVerify: true,
        },
      },
    ],
  },
}, { provider });

const sharedIdentity = new infisical.Identity("kubernetes-shared", {
  orgId: "sapslaj",
  role: "member",
});
