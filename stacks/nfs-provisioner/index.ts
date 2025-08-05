import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { getDnsHostName, newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const dnsHostName = getDnsHostName();

const namespace = new kubernetes.core.v1.Namespace("nfs-provisioner", {
  metadata: {
    name: "nfs-provisioner",
  },
}, { provider });

const nfsProvisioner = new kubernetes.helm.v3.Chart("nfs-subdir-external-provisioner", {
  chart: "nfs-subdir-external-provisioner",
  version: "4.0.18",
  fetchOpts: {
    repo: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner",
  },
  namespace: namespace.metadata.name,
  values: {
    nfs: {
      server: "172.24.4.10",
      path: pulumi.interpolate`/mnt/exos/volumes/${dnsHostName}/nfs`,
    },
    storageClass: {
      create: true,
      name: "nfs",
      accessModes: "ReadWriteMany",
    },
  },
}, {
  provider,
});
