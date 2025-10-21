import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as authentik from "@sapslaj/pulumi-authentik";

import { chartVersion, newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";
import { sha256, yamlencode } from "../../components/std";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("netbox", {
  metadata: {
    name: "netbox",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikProvider = new authentik.ProviderOauth2("netbox", {
  name: "Netbox",
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
      url: "https://netbox.sapslaj.cloud/oauth/complete/oidc/",
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
  ],
});

const authentikApplication = new authentik.Application("netbox", {
  name: "NetBox",
  slug: "netbox",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

const authentikGroupAccess = new authentik.Group("netbox-access", {
  name: "NetBox Access",
});

new authentik.PolicyBinding("netbox-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const oidcSecret = new kubernetes.core.v1.Secret("netbox-oidc", {
  metadata: {
    name: "netbox-oidc",
    namespace: namespace.metadata.name,
  },
  stringData: {
    "oidc.yaml": yamlencode({
      SOCIAL_AUTH_OIDC_ENDPOINT: pulumi
        .interpolate`https://login.sapslaj.cloud/application/o/${authentikApplication.slug}/`,
      SOCIAL_AUTH_OIDC_KEY: authentikProvider.clientId,
      SOCIAL_AUTH_OIDC_SECRET: authentikProvider.clientSecret,
      SOCIAL_AUTH_OIDC_SCOPE: [
        "openid",
        "profile",
        "email",
        "roles",
      ],
      LOGOUT_REDIRECT_URL: pulumi
        .interpolate`https://login.sapslaj.cloud/application/o/${authentikApplication.slug}/end-session/`,
      SOCIAL_AUTH_REDIRECT_IS_HTTPS: true,
      SOCIAL_AUTH_BACKEND_ATTRS: {
        oidc: ["sapslaj cloud login", "login"],
      },
    }),
  },
}, { provider });

const postgresql = new kubernetes.apiextensions.CustomResource("netbox-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "netbox-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.netbox",
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

const valkey = new Valkey("netbox-valkey", {
  name: "netbox-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/component": "valkey",
    "app.kubernetes.io/instance": "netbox-valkey",
    "app.kubernetes.io/name": "netbox-valkey",
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.netbox",
  },
  volumeClaimTemplates: [
    {
      name: "data",
      mountPath: "/data",
      spec: {
        storageClassName: "shortrack-mitsuru-red",
        accessModes: [
          "ReadWriteOnce",
        ],
        resources: {
          requests: {
            storage: "10Gi",
          },
        },
      },
    },
  ],
}, {
  providers: {
    kubernetes: provider,
  },
});

const secretKey = new random.RandomPassword("netbox-secret-key", {
  length: 64,
});

// just a placeholder because the Helm chart insists there has to be a secret
// for the superuser
const superuserSecret = new kubernetes.core.v1.Secret("netbox-superuser", {
  metadata: {
    name: "netbox-superuser",
    namespace: namespace.metadata.name,
  },
  type: "kubernetes.io/basic-auth",
  stringData: {
    api_token: new random.RandomBytes("netbox-superadmin", {
      length: 64,
    }).hex,
    email: "admin@sapslaj.com",
    password: new random.RandomPassword("netbox-superadmin", {
      length: 64,
    }).result,
    username: "superuser",
  },
}, { provider });

const chart = new kubernetes.helm.v4.Chart("netbox", {
  chart: "oci://ghcr.io/netbox-community/netbox-chart/netbox",
  version: chartVersion({ name: "netbox" }),
  namespace: namespace.metadata.name,
  skipCrds: true,
  values: {
    superuser: {
      existingSecret: superuserSecret.metadata.name,
    },
    loginRequired: true,
    remoteAuth: {
      enabled: true,
      backends: [
        "social_core.backends.open_id_connect.OpenIdConnectAuth",
      ],
    },
    extraConfig: [
      {
        secret: {
          secretName: oidcSecret.metadata.name,
          optional: false,
        },
      },
    ],
    secretKey: secretKey.result,
    replicaCount: 2,
    persistence: {
      enabled: true,
      storageClass: "nfs",
      accessMode: "ReadWriteMany",
    },
    resources: {
      limits: {
        cpu: "2",
        "ephemeral-storage": "2Gi",
        memory: "1.5Gi",
      },
      requests: {
        cpu: "500m",
        "ephemeral-storage": "50Mi",
        memory: "1Gi",
      },
    },
    podAnnotations: {
      "nekopara.sapslaj.cloud/config-hashes": yamlencode({
        "oidc-secret": sha256(yamlencode(oidcSecret.data)),
      }),
    },
    ingress: {
      enabled: true,
      className: "traefik",
      annotations: {
        "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
      },
      hosts: [
        {
          host: "netbox.sapslaj.cloud",
          paths: [
            "/",
          ],
        },
      ],
    },
    metrics: {
      enabled: true,
      serviceMonitor: {
        enabled: true,
      },
    },
    postgresql: {
      enabled: false,
    },
    externalDatabase: {
      host: "netbox-postgresql-rw",
      port: 5432,
      database: "netbox",
      username: "netbox",
      existingSecretName: "netbox-postgresql-app",
      existingSecretKey: "password",
    },
    valkey: {
      enabled: false,
    },
    tasksDatabase: {
      host: valkey.readWriteService.metadata.name,
    },
    cachingDatabase: {
      host: valkey.readWriteService.metadata.name,
    },
    init: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
    },
    test: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
    },
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("netbox.sapslaj.cloud", {
  hostname: "netbox.sapslaj.cloud",
}, {
  providers: {
    kubernetes: provider,
  },
});
