import * as kubernetes from "@pulumi/kubernetes";

import { newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("opensearch-operator", {
  metadata: {
    name: "opensearch-operator",
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("opensearch-operator", {
  chart: "opensearch-operator",
  fetchOpts: {
    repo: "https://opensearch-project.github.io/opensearch-k8s-operator/",
  },
  version: "2.8.0",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    installCRDs: false,
  },
}, {
  provider,
});
