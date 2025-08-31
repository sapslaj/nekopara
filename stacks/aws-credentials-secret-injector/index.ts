import * as aws from "@pulumi/aws";
import * as docker_build from "@pulumi/docker-build";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { iamPolicyDocument } from "../../components/aws-utils";
import { newK3sProvider } from "../../components/k3s-shared";

const image = new docker_build.Image("aws-credentials-secret-injector", {
  push: true,
  tags: [
    "oci.sapslaj.xyz/aws-credentials-secret-injector",
  ],
});

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("aws-credentials-secret-injector", {
  metadata: {
    name: "aws-credentials-secret-injector",
  },
}, { provider });

const iamUser = new aws.iam.User(`aws-credentials-secret-injector-${pulumi.getStack()}`);

new aws.iam.UserPolicy("aws-credentials-secret-injector", {
  user: iamUser.name,
  policy: iamPolicyDocument({
    statements: [
      {
        resources: ["*"],
        actions: [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:GetUser",
          "iam:ListAccessKeys",
        ],
      },
    ],
  }),
});

const awsSecret = new kubernetes.core.v1.Secret("aws-credentials-secret-injector", {
  metadata: {
    name: "aws-credentials-secret-injector",
    namespace: namespace.metadata.name,
  },
  // aws-credentials-secret-injector manages its own credentials rotation
}, {
  provider,
  ignoreChanges: [
    "data",
    "stringData",
  ],
});

const serviceAccount = new kubernetes.core.v1.ServiceAccount("aws-credentials-secret-injector", {
  metadata: {
    name: "aws-credentials-secret-injector",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "aws-credentials-secret-injector",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "aws-credentials-secret-injector",
      "app.kubernetes.io/part-of": "aws-credentials-secret-injector",
      "k3s.sapslaj.xyz/stack": "nekopara.aws-credentials-secret-injector",
    },
  },
}, { provider });

const role = new kubernetes.rbac.v1.ClusterRole("aws-credentials-secret-injector", {
  metadata: {
    name: "aws-credentials-secret-injector",
    labels: {
      "app.kubernetes.io/instance": "aws-credentials-secret-injector",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "aws-credentials-secret-injector",
      "app.kubernetes.io/part-of": "aws-credentials-secret-injector",
      "k3s.sapslaj.xyz/stack": "nekopara.aws-credentials-secret-injector",
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
        "update",
        "patch",
      ],
    },
  ],
}, { provider });

new kubernetes.rbac.v1.ClusterRoleBinding("aws-credentials-secret-injector", {
  metadata: {
    name: "aws-credentials-secret-injector",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/instance": "aws-credentials-secret-injector",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "aws-credentials-secret-injector",
      "app.kubernetes.io/part-of": "aws-credentials-secret-injector",
      "k3s.sapslaj.xyz/stack": "nekopara.aws-credentials-secret-injector",
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

new kubernetes.apps.v1.Deployment("aws-credentials-secret-injector", {
  metadata: {
    name: "aws-credentials-secret-injector",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "controller",
      "app.kubernetes.io/instance": "aws-credentials-secret-injector",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/name": "aws-credentials-secret-injector",
      "app.kubernetes.io/part-of": "aws-credentials-secret-injector",
      "k3s.sapslaj.xyz/stack": "nekopara.aws-credentials-secret-injector",
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
        "app.kubernetes.io/instance": "aws-credentials-secret-injector",
        "app.kubernetes.io/name": "aws-credentials-secret-injector",
      },
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "controller",
          "app.kubernetes.io/instance": "aws-credentials-secret-injector",
          "app.kubernetes.io/managed-by": "Pulumi",
          "app.kubernetes.io/name": "aws-credentials-secret-injector",
          "app.kubernetes.io/part-of": "aws-credentials-secret-injector",
          "k3s.sapslaj.xyz/stack": "nekopara.aws-credentials-secret-injector",
        },
      },
      spec: {
        serviceAccountName: serviceAccount.metadata.name,
        containers: [
          {
            name: "aws-credentials-secret-injector",
            image: image.ref,
            env: [
              {
                name: "AWS_REGION",
                value: "us-east-1",
              },
            ],
            envFrom: [
              {
                secretRef: {
                  name: awsSecret.metadata.name,
                  optional: false,
                },
              },
            ],
          },
        ],
      },
    },
  },
}, { provider });
