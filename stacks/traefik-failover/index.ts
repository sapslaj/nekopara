import * as docker_build from "@pulumi/docker-build";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { getSecretValueOutput } from "../../components/infisical";
import { newK3sProvider } from "../../components/k3s-shared";

const image = new docker_build.Image("traefik-failover", {
  push: true,
  tags: [
    "oci.sapslaj.xyz/traefik-failover",
  ],
});

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("traefik-failover", {
  metadata: {
    name: "traefik-failover",
  },
}, { provider });

const serviceAccount = new kubernetes.core.v1.ServiceAccount("traefik-failover", {
  metadata: {
    name: "traefik-failover",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "traefik-failover",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "traefik-failover",
      "app.kubernetes.io/part-of": "traefik-failover",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik-failover",
    },
  },
}, { provider });

const role = new kubernetes.rbac.v1.ClusterRole("traefik-failover", {
  metadata: {
    name: "traefik-failover",
    labels: {
      "app.kubernetes.io/instance": "traefik-failover",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "traefik-failover",
      "app.kubernetes.io/part-of": "traefik-failover",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik-failover",
    },
  },
  rules: [
    {
      apiGroups: [
        "",
      ],
      resources: [
        "pods",
        "nodes",
      ],
      verbs: [
        "get",
        "list",
        "watch",
      ],
    },
  ],
}, { provider });

new kubernetes.rbac.v1.ClusterRoleBinding("traefik-failover", {
  metadata: {
    name: "traefik-failover",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "traefik-failover",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "traefik-failover",
      "app.kubernetes.io/part-of": "traefik-failover",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik-failover",
    },
  },
  roleRef: {
    apiGroup: "rbac.authorization.k8s.io",
    kind: "ClusterRole",
    name: role.metadata.name,
  },
  subjects: [
    {
      kind: "ServiceAccount",
      name: serviceAccount.metadata.name,
      namespace: serviceAccount.metadata.namespace,
    },
  ],
}, { provider });

const secret = new kubernetes.core.v1.Secret("traefik-failover", {
  metadata: {
    name: "traefik-failover",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "controller",
      "app.kubernetes.io/instance": "traefik-failover",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "traefik-failover",
      "app.kubernetes.io/part-of": "traefik-failover",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik-failover",
    },
  },
  stringData: {
    VYOS_API_TOKEN: getSecretValueOutput({
      key: "vyos-api-token",
    }),
  },
});

new kubernetes.apps.v1.Deployment("traefik-failover", {
  metadata: {
    name: "traefik-failover",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "controller",
      "app.kubernetes.io/instance": "traefik-failover",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "traefik-failover",
      "app.kubernetes.io/part-of": "traefik-failover",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik-failover",
    },
    annotations: {
      "reloader.stakater.com/auto": "true",
    },
  },
  spec: {
    replicas: 1,
    strategy: {
      type: "Recreate",
    },
    selector: {
      matchLabels: {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "traefik-failover",
        "app.kubernetes.io/name": "traefik-failover",
      },
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "controller",
          "app.kubernetes.io/instance": "traefik-failover",
          "app.kubernetes.io/managed-by": "Pulumi",
          "app.kubernetes.io/name": "traefik-failover",
          "app.kubernetes.io/part-of": "traefik-failover",
          "k3s.sapslaj.xyz/stack": "nekopara.traefik-failover",
        },
      },
      spec: {
        serviceAccountName: serviceAccount.metadata.name,
        containers: [
          {
            name: "traefik-failover",
            image: image.ref,
            envFrom: [
              {
                secretRef: {
                  name: secret.metadata.name,
                },
              },
            ],
          },
        ],
      },
    },
  },
}, { provider });
