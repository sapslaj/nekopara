import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { chartVersion, newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const prometheusOperatorCrds = new kubernetes.helm.v3.Chart("prometheus-operator-crds", {
  chart: "prometheus-operator-crds",
  fetchOpts: {
    repo: "https://prometheus-community.github.io/helm-charts",
  },
  version: chartVersion({ name: "prometheus-operator-crds" }),
}, {
  provider,
});

const victoriaMetricsOperatorCRDs = new kubernetes.helm.v3.Chart("victoria-metrics-operator-crds", {
  chart: "victoria-metrics-operator-crds",
  fetchOpts: {
    repo: "https://victoriametrics.github.io/helm-charts/",
  },
  version: chartVersion({ name: "victoria-metrics-operator-crds" }),
  namespace: "kube-system",
  values: {},
}, {
  provider,
  dependsOn: [
    prometheusOperatorCrds,
  ],
});

const traefikCRDs = new kubernetes.helm.v3.Chart("traefik-crds", {
  chart: "traefik-crds",
  fetchOpts: {
    repo: "https://traefik.github.io/charts",
  },
  version: chartVersion({ name: "traefik-crds" }),
  namespace: "kube-system",
  values: {},
}, {
  provider,
});

const cloudnativePGCRDs = new kubernetes.helm.v3.Chart("cloudnative-pg-crds", {
  chart: "cloudnative-pg",
  fetchOpts: {
    repo: "https://cloudnative-pg.github.io/charts",
  },
  version: chartVersion({ name: "cloudnative-pg" }),
  namespace: "kube-system",
  values: {},
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind !== "CustomResourceDefinition") {
        obj.apiVersion = "v1";
        obj.kind = "List";
      }
    },
  ],
}, {
  provider,
});

const opensearchOperatorCRDs = new kubernetes.kustomize.v2.Directory("opensearch-k8s-operator", {
  namespace: "kube-system",
  directory: "./crds/opensearch-k8s-operator/",
}, {
  provider,
});

const infisicalSecretsOperatorCRDs = new kubernetes.helm.v3.Chart("infisical-secrets-operator", {
  chart: "secrets-operator",
  fetchOpts: {
    repo: "https://dl.cloudsmith.io/public/infisical/helm-charts/helm/charts/",
  },
  version: chartVersion({ name: "secrets-operator" }),
  namespace: "kube-system",
  skipCRDRendering: false,
  values: {
    installCRDs: true,
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind !== "CustomResourceDefinition") {
        obj.apiVersion = "v1";
        obj.kind = "List";
      }
    },
  ],
}, {
  provider,
});

const esoCRDs = new kubernetes.kustomize.v2.Directory("external-secrets-operator", {
  namespace: "kube-system",
  directory: "./crds/external-secrets-operator/",
}, {
  provider,
});
