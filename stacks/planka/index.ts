import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as authentik from "@sapslaj/pulumi-authentik";

import { chartVersion, newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("planka", {
  metadata: {
    name: "planka",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAccess = new authentik.Group("planka-access", {
  name: "PLANKA Access",
});

const authentikGroupAdmins = new authentik.Group("planka-admins", {
  name: "PLANKA Admins",
});

const authentikProvider = new authentik.ProviderOauth2("planka", {
  name: "PLANKA",
  clientId: clientID.id,
  authorizationFlow: authentik.getFlowOutput({
    slug: "default-provider-authorization-implicit-consent",
  }).id,
  invalidationFlow: authentik.getFlowOutput({
    slug: "default-provider-invalidation-flow",
  }).id,
  allowedRedirectUris: [
    {
      matching_mode: "strict",
      url: "https://planka.sapslaj.cloud/oidc-callback",
    },
  ],
  propertyMappings: [
    authentik.getPropertyMappingProviderScopeOutput({
      name: "authentik default OAuth Mapping: OpenID 'email'",
    }).id,
    authentik.getPropertyMappingProviderScopeOutput({
      name: "authentik default OAuth Mapping: OpenID 'profile'",
    }).id,
    authentik.getPropertyMappingProviderScopeOutput({
      name: "authentik default OAuth Mapping: OpenID 'openid'",
    }).id,
    authentik.getPropertyMappingProviderScopeOutput({
      name: "Group Membership",
    }).id,
  ],
});

const authentikApplication = new authentik.Application("planka", {
  name: "PLANKA",
  slug: "planka",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

new authentik.PolicyBinding("planka-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const postgresql = new kubernetes.apiextensions.CustomResource("planka-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "planka-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.planka",
    },
  },
  spec: {
    instances: 3,
    enableSuperuserAccess: true,
    storage: {
      size: "10Gi",
      storageClass: "shortrack-mitsuru-red",
    },
    monitoring: {
      enablePodMonitor: true,
    },
  },
}, { provider });

const adminSecret = new kubernetes.core.v1.Secret("planka-admin", {
  metadata: {
    name: "planka-admin",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.planka",
    },
  },
  stringData: {
    username: "admin",
    password: new random.RandomPassword("planka-admin", {
      length: 64,
      special: false,
    }).result,
  },
}, { provider });

const secretKeySecret = new kubernetes.core.v1.Secret("secret-key", {
  metadata: {
    name: "planka-secret-key",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.planka",
    },
  },
  stringData: {
    key: new random.RandomBytes("secret-key", {
      length: 45,
    }).base64,
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("planka", {
  chart: "planka",
  fetchOpts: {
    repo: "http://plankanban.github.io/planka",
  },
  version: chartVersion({ name: "planka" }),
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    replicaCount: 2,
    existingSecretkeySecret: secretKeySecret.metadata.name,
    existingAdminCredsSecret: adminSecret.metadata.name,
    baseUrl: "https://planka.sapslaj.cloud",
    ingress: {
      enabled: true,
      className: "traefik",
      annotations: {
        "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
      },
      hosts: [
        {
          host: "planka.sapslaj.cloud",
          paths: [
            {
              path: "/",
              pathType: "Prefix",
            },
          ],
        },
      ],
    },
    postgresql: {
      enabled: false,
    },
    existingDburlSecret: "planka-postgresql-app",
    persistence: {
      enabled: true,
      storageClass: "nfs-mitsuru",
      accessMode: "ReadWriteMany",
    },
    oidc: {
      enabled: true,
      clientId: authentikProvider.clientId,
      clientSecret: authentikProvider.clientSecret,
      issuerUrl: "https://login.sapslaj.cloud/application/o/planka/",
      scopes: [
        "openid",
        "profile",
        "email",
        "groups",
      ],
      admin: {
        roles: [
          authentikGroupAdmins.name,
        ],
      },
    },
    extraEnv: [
      {
        name: "OIDC_ID_TOKEN_SIGNED_RESPONSE_ALG",
        value: "HS256",
      },
      {
        name: "OIDC_USERINFO_SIGNED_RESPONSE_ALG",
        value: "HS256",
      },
      {
        name: "OIDC_ENFORCED",
        value: "true",
      },
      {
        name: "SHOW_DETAILED_AUTH_ERRORS",
        value: "true",
      },
      {
        name: "OIDC_CLAIMS_SOURCE",
        value: "id_token",
      },
    ],
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind === "Deployment" && obj.metadata?.name === "planka") {
        obj.spec.strategy.type = "RollingUpdate";
      }
    },
  ],
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("planka.sapslaj.cloud", {
  hostname: "planka.sapslaj.cloud",
});
