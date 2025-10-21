import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as gitea from "@sapslaj/pulumi-gitea";

import { getSecretValueOutput, Secret, SecretFolder } from "../../components/infisical";
import { newK3sProvider } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { jsonencode } from "../../components/std";

const provider = newK3sProvider();

const secretFolder = new SecretFolder("renovate", {
  name: "renovate",
});

const bootstrapGiteaProvider = new gitea.Provider("gitea", {
  baseUrl: "https://git.sapslaj.cloud",
  token: getSecretValueOutput({
    folder: "/ci",
    key: "GITEA_ADMIN_TOKEN",
  }),
});

const giteaUserPassword = new random.RandomPassword("gitea-renovate-password", {
  length: 64,
});

new Secret("gitea-renovate-password", {
  parent: secretFolder.path,
  name: "GITEA_PASSWORD",
  value: giteaUserPassword.result,
});

const giteaUser = new gitea.User("renovate", {
  username: "renovate",
  password: giteaUserPassword.result,
  email: "renovate@sapslaj.com",
  loginName: "renovate",
  active: true,
  fullName: "Renovate",
  admin: false,
  prohibitLogin: false,
  forcePasswordChange: true,
  mustChangePassword: false,
}, {
  provider: bootstrapGiteaProvider,
});

// NOTE: managed out-of-band due to upstream Gitea provider limitations
const giteaToken = getSecretValueOutput({
  folder: secretFolder.path,
  key: "GITEA_TOKEN",
});

const namespace = new kubernetes.core.v1.Namespace("renovate", {
  metadata: {
    name: "renovate",
  },
}, { provider });

const chart = new kubernetes.helm.v4.Chart("renovate", {
  chart: "oci://ghcr.io/renovatebot/charts/renovate",
  version: "44.15.1",
  namespace: namespace.metadata.name,
  skipCrds: true,
  values: {
    cronjob: {
      schedule: "@hourly",
    },
    renovate: {
      config: jsonencode({
        autodiscover: true,
        endpoint: "https://git.sapslaj.cloud/api/v1",
        platform: "gitea",
      }),
    },
    secrets: {
      RENOVATE_TOKEN: giteaToken,
      RENOVATE_GITHUB_COM_TOKEN: getSecretValueOutput({
        folder: secretFolder.path,
        key: "RENOVATE_GITHUB_COM_TOKEN",
      }),
    },
    env: {
      LOG_LEVEL: "debug",
    },
  },
}, {
  provider,
});
