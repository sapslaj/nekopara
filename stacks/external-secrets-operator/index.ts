import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("external-secrets-operator", {
  metadata: {
    name: "external-secrets-operator",
  },
}, { provider });

const eso = new kubernetes.kustomize.v2.Directory("external-secrets-operator", {
  directory: "./charts/external-secrets/",
  namespace: namespace.metadata.name,
}, {
  provider,
});

const awsUser = new aws.iam.User(`external-secrets-operator-${pulumi.getStack()}`);

new aws.iam.UserPolicyAttachment("SecretsManagerReadWrite", {
  user: awsUser.name,
  policyArn: "arn:aws:iam::aws:policy/SecretsManagerReadWrite",
});

const awsSecret = new kubernetes.core.v1.Secret("external-secrets-operator-aws", {
  metadata: {
    name: "external-secrets-operator-aws",
    namespace: namespace.metadata.name,
    annotations: {
      "aws-credentials-secret-injector.sapslaj.cloud/user-name": awsUser.name,
    },
  },
}, {
  provider,
  ignoreChanges: [
    "data",
    "stringData",
  ],
});

new kubernetes.apiextensions.CustomResource("cluster-secret-store-aws-secretsmanager-us-east-1", {
  apiVersion: "external-secrets.io/v1",
  kind: "ClusterSecretStore",
  metadata: {
    name: "aws-secretsmanager-us-east-1",
  },
  spec: {
    provider: {
      aws: {
        service: "SecretsManager",
        region: "us-east-1",
        auth: {
          secretRef: {
            accessKeyIDSecretRef: {
              namespace: awsSecret.metadata.namespace,
              name: awsSecret.metadata.name,
              key: "AWS_ACCESS_KEY_ID",
            },
            secretAccessKeySecretRef: {
              namespace: awsSecret.metadata.namespace,
              name: awsSecret.metadata.name,
              key: "AWS_SECRET_ACCESS_KEY",
            },
          },
        },
      },
    },
  },
}, { provider });
