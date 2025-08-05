import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("shortrack", {
  metadata: {
    name: "shortrack",
  },
}, { provider });

new kubernetes.kustomize.v2.Directory("shortrack", {
  namespace: namespace.metadata.name,
  directory: "./shortrack-k8s-provisioner",
}, { provider });

new kubernetes.storage.v1.StorageClass("shortrack-aqua-exos", {
  metadata: {
    name: "shortrack-aqua-exos",
  },
  provisioner: "shortrack.sapslaj.xyz",
  parameters: {
    poolName: "aqua-exos",
    serverAddr: "172.24.4.10:29581",
    targetPortal: "172.24.4.10:3260",
    fsType: "ext4",
  },
}, { provider });
