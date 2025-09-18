import * as docker_build from "@pulumi/docker-build";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";

const provider = newK3sProvider();

const image = new docker_build.Image("test", {
  push: true,
  tags: [
    "oci.sapslaj.xyz/cnpg-pgdump",
  ],
});

const namespace = new kubernetes.core.v1.Namespace("cnpg-pgdump", {
  metadata: {
    name: "cnpg-pgdump",
  },
}, { provider });

const serviceAccount = new kubernetes.core.v1.ServiceAccount("cnpg-pgdump", {
  metadata: {
    name: "cnpg-pgdump",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "cnpg-pgdump",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "cnpg-pgdump",
      "app.kubernetes.io/part-of": "cnpg-pgdump",
      "k3s.sapslaj.xyz/stack": "nekopara.cnpg-pgdump",
    },
  },
}, { provider });

const role = new kubernetes.rbac.v1.ClusterRole("cnpg-pgdump", {
  metadata: {
    name: "cnpg-pgdump",
    labels: {
      "app.kubernetes.io/instance": "cnpg-pgdump",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "cnpg-pgdump",
      "app.kubernetes.io/part-of": "cnpg-pgdump",
      "k3s.sapslaj.xyz/stack": "nekopara.cnpg-pgdump",
    },
  },
  rules: [
    {
      apiGroups: [
        "",
      ],
      resources: [
        "secrets",
      ],
      verbs: [
        "get",
        "list",
        "watch",
      ],
    },
  ],
}, { provider });

new kubernetes.rbac.v1.ClusterRoleBinding("cnpg-pgdump", {
  metadata: {
    name: "cnpg-pgdump",
    labels: {
      "app.kubernetes.io/instance": "cnpg-pgdump",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "cnpg-pgdump",
      "app.kubernetes.io/part-of": "cnpg-pgdump",
      "k3s.sapslaj.xyz/stack": "nekopara.cnpg-pgdump",
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

const pvc = new kubernetes.core.v1.PersistentVolumeClaim("cnpg-pgdump", {
  metadata: {
    name: "cnpg-pgdump",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "cnpg-pgdump",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "cnpg-pgdump",
      "app.kubernetes.io/part-of": "cnpg-pgdump",
      "k3s.sapslaj.xyz/stack": "nekopara.cnpg-pgdump",
    },
  },
  spec: {
    accessModes: [
      "ReadWriteMany",
    ],
    storageClassName: "nfs-mitsuru",
    resources: {
      requests: {
        storage: "100Gi",
      },
    },
  },
}, { provider });

new kubernetes.batch.v1.CronJob("cnpg-pgdump", {
  metadata: {
    name: "cnpg-pgdump",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "cnpg-pgdump",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "cnpg-pgdump",
      "app.kubernetes.io/part-of": "cnpg-pgdump",
      "k3s.sapslaj.xyz/stack": "nekopara.cnpg-pgdump",
    },
  },
  spec: {
    schedule: "@daily",
    jobTemplate: {
      spec: {
        template: {
          spec: {
            serviceAccountName: serviceAccount.metadata.name,
            restartPolicy: "OnFailure",
            volumes: [
              {
                name: "backups",
                persistentVolumeClaim: {
                  claimName: pvc.metadata.name,
                },
              },
            ],
            containers: [
              {
                name: "cnpg-pgdump",
                image: image.ref,
                volumeMounts: [
                  {
                    name: "backups",
                    mountPath: "/backups",
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
}, { provider });
