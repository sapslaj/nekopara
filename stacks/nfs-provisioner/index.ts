import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { chartVersion, newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("nfs-provisioner", {
  metadata: {
    name: "nfs-provisioner",
  },
}, { provider });

const nfsProvisioner = new kubernetes.helm.v3.Chart("nfs-subdir-external-provisioner", {
  chart: "nfs-subdir-external-provisioner",
  version: chartVersion({ name: "nfs-subdir-external-provisioner" }),
  fetchOpts: {
    repo: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner",
  },
  namespace: namespace.metadata.name,
  values: {
    nfs: {
      server: "172.24.4.10",
      path: "/mnt/exos/volumes/nekopara/nfs",
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

const nfsProvisionerAqua = new kubernetes.helm.v3.Chart("nfs-subdir-external-provisioner-aqua", {
  chart: "nfs-subdir-external-provisioner",
  version: chartVersion({ name: "nfs-subdir-external-provisioner" }),
  fetchOpts: {
    repo: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner",
  },
  namespace: namespace.metadata.name,
  values: {
    nfs: {
      server: "172.24.4.10",
      path: "/mnt/exos/volumes/nekopara/nfs",
    },
    storageClass: {
      create: true,
      name: "nfs-aqua",
      accessModes: "ReadWriteMany",
    },
  },
}, {
  provider,
});

const nfsProvisionerMitsuru = new kubernetes.helm.v3.Chart("nfs-subdir-external-provisioner-mitsuru", {
  chart: "nfs-subdir-external-provisioner",
  version: chartVersion({ name: "nfs-subdir-external-provisioner" }),
  fetchOpts: {
    repo: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner",
  },
  namespace: namespace.metadata.name,
  values: {
    nfs: {
      server: "172.24.4.11",
      path: "/red/nekopara/nfs",
    },
    storageClass: {
      create: true,
      name: "nfs-mitsuru",
      accessModes: "ReadWriteMany",
    },
  },
}, {
  provider,
});
