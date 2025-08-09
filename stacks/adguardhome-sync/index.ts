import * as kubernetes from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

import { newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("adguardhome-sync", {
  metadata: {
    name: "adguardhome-sync",
  },
}, { provider });

const password = new random.RandomPassword("adguardhome", {
  length: 32,
  lower: true,
  number: true,
  numeric: true,
  special: true,
  upper: true,
});

const secret = new kubernetes.core.v1.Secret("adguardhome-sync-credentials", {
  metadata: {
    name: "adguardhome-sync-credentials",
    namespace: namespace.metadata.name,
  },
  stringData: {
    username: "admin",
    password: password.result,
  },
}, { provider });

new kubernetes.kustomize.v2.Directory("adguardhome-sync", {
  namespace: namespace.metadata.name,
  directory: __dirname,
}, {
  provider,
  dependsOn: [
    secret,
  ],
});
