import * as kubernetes from "@pulumi/kubernetes";

import { newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const coredns = new kubernetes.helm.v3.Chart("coredns", {
  chart: "coredns",
  namespace: "kube-system",
  version: "1.43.0",
  fetchOpts: {
    repo: "https://coredns.github.io/helm",
  },
  values: {
    image: {
      // repository: "k8s.gcr.io/coredns/coredns",
    },
    replicaCount: 3,
    prometheus: {
      service: {
        service: {
          enabled: true,
        },
        monitor: {
          enabled: true,
        },
      },
    },
    service: {
      clusterIP: "10.43.0.10",
      name: "kube-dns",
    },
    serviceAccount: {
      create: true,
    },
    rbac: {
      create: true,
    },
    tolerations: [
      {
        key: "k3s.sapslaj.xyz/role",
        operator: "Equal",
        value: "control-plane",
        effect: "NoSchedule",
      },
    ],
    k8sAppLabelOverride: "kube-dns",
  },
}, {
  provider,
});

const metricsServer = new kubernetes.helm.v3.Chart("metrics-server", {
  chart: "metrics-server",
  namespace: "kube-system",
  version: "3.12.2",
  fetchOpts: {
    repo: "https://kubernetes-sigs.github.io/metrics-server/",
  },
  values: {
    serviceMonitor: {
      enabled: true,
    },
  },
}, {
  provider,
  retainOnDelete: true,
});
