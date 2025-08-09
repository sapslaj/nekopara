import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const prometheusOperatorCrds = new kubernetes.helm.v3.Chart("prometheus-operator-crds", {
  chart: "prometheus-operator-crds",
  fetchOpts: {
    repo: "https://prometheus-community.github.io/helm-charts",
  },
  version: "22.0.2",
}, {
  provider,
});

const victoriaMetricsOperatorCRDs = new kubernetes.helm.v3.Chart("victoria-metrics-operator-crds", {
  chart: "victoria-metrics-operator-crds",
  fetchOpts: {
    repo: "https://victoriametrics.github.io/helm-charts/",
  },
  version: "0.4.0",
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
  version: "1.10.0",
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
  version: "0.25.0",
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

const opensearchOperatorCRDs = new kubernetes.helm.v3.Chart("opensearch-k8s-operator", {
  chart: "opensearch-operator",
  fetchOpts: {
    repo: "https://opensearch-project.github.io/opensearch-k8s-operator/",
  },
  version: "2.8.0",
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
