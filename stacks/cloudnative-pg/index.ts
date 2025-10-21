import * as kubernetes from "@pulumi/kubernetes";

import { chartVersion, newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("cnpg-system", {
  metadata: {
    name: "cnpg-system",
  },
}, { provider });

new kubernetes.helm.v3.Chart("cloudnative-pg", {
  chart: "cloudnative-pg",
  fetchOpts: {
    repo: "https://cloudnative-pg.github.io/charts",
  },
  version: chartVersion({ name: "cloudnative-pg" }),
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    crds: {
      create: false,
    },
    monitoring: {
      podMonitorEnabled: true,
      grafanaDashboard: {
        create: true,
      },
    },
  },
}, {
  provider,
});
