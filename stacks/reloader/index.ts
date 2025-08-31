import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";

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
  version: "2.2.2",
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
