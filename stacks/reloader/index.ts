import * as kubernetes from "@pulumi/kubernetes";

import { chartVersion, newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("reloader", {
  metadata: {
    name: "reloader",
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("reloader", {
  chart: "reloader",
  fetchOpts: {
    repo: "https://stakater.github.io/stakater-charts",
  },
  version: chartVersion({ name: "reloader" }),
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    reloader: {
      podMonitor: {
        enabled: true,
      },
    },
  },
}, {
  provider,
});
