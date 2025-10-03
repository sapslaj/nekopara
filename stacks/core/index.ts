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
      repository: "registry.k8s.io/coredns/coredns",
      tag: "v1.12.2",
    },
    replicaCount: 3,
    resources: {
      limits: {
        cpu: "1",
        memory: "128Mi",
      },
      requests: {
        cpu: "1",
        memory: "128Mi",
      },
    },
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
    affinity: {
      podAntiAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            labelSelector: {
              matchLabels: {
                "app.kubernetes.io/name": "coredns",
                "app.kubernetes.io/instance": "coredns",
              },
            },
            topologyKey: "kubernetes.io/hostname",
          },
        ],
      },
    },
    topologySpreadConstraints: [
      {
        maxSkew: 1,
        whenUnsatisfiable: "ScheduleAnyway",
        topologyKey: "kubernetes.io/hostname",
        labelSelector: {
          matchLabels: {
            "app.kubernetes.io/name": "coredns",
            "app.kubernetes.io/instance": "coredns",
          },
        },
      },
    ],
    tolerations: [
      {
        key: "k3s.sapslaj.xyz/role",
        operator: "Equal",
        value: "control-plane",
        effect: "NoSchedule",
      },
    ],
    podDisruptionBudget: {
      minAvailable: 2,
    },
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
