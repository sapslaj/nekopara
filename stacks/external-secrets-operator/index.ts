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
