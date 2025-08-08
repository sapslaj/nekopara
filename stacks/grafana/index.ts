import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { DNSRecord } from "../../components/shimiko/DNSRecord";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("grafana", {
  metadata: {
    name: "grafana",
  },
}, { provider });

const grafana = new kubernetes.helm.v3.Chart("grafana", {
  chart: "grafana",
  fetchOpts: {
    repo: "https://grafana.github.io/helm-charts",
  },
  version: "9.2.10",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    serviceMonitor: {
      enabled: true,
    },
    ingress: {
      enabled: true,
      hosts: [
        "grafana.sapslaj.xyz",
      ],
    },
    persistence: {
      type: "pvc",
      enabled: true,
      storageClassName: "shortrack-aqua-exos",
    },
    plugins: [
      "victoriametrics-logs-datasource",
    ],
    sidecar: {
      dashboards: {
        enabled: true,
        searchNamespace: "ALL",
      },
      datasources: {
        enabled: true,
        searchNamespace: "ALL",
      },
      plugins: {
        enabled: true,
        searchNamespace: "ALL",
      },
    },
    useStatefulSet: true,
    assertNoLeakedSecrets: false,
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind === "Secret" && obj.metadata?.name === "grafana") {
        opts.ignoreChanges = [
          ...(opts.ignoreChanges ?? []),
          "data.admin-password",
        ];
      }
      if (obj.kind === "Role" && obj.metadata?.name === "grafana") {
        if (Array.isArray(obj.rules) && obj.rules.length === 0) {
          obj.rules = null;
        }
      }
      if (obj.kind === "StatefulSet" && obj.metadata?.name === "grafana") {
        opts.ignoreChanges = [
          ...(opts.ignoreChanges ?? []),
          `spec.template.metadata.annotations.["checksum/secret"]`,
        ];
      }
    },
  ],
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new DNSRecord("grafana", {
  name: "grafana",
  records: ["homelab.sapslaj.com."],
  type: "CNAME",
});
