import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as authentik from "@sapslaj/pulumi-authentik";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("gitea", {
  metadata: {
    name: "gitea",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAccess = new authentik.Group("gitea-access", {
  name: "Gitea Access",
});

const authentikGroupUsers = new authentik.Group("gitea-users", {
  name: "Gitea Users",
});

const authentikGroupAdmins = new authentik.Group("gitea-admins", {
  name: "Gitea Admins",
});

const authentikGroupRestricted = new authentik.Group("gitea-restricted", {
  name: "Gitea Restricted",
});

const authentikGroupScopeMapping = new authentik.ScopeMapping("gitea-group", {
  name: "authentik gitea OAuth Mapping: OpenID 'gitea'",
  scopeName: "gitea",
  expression: `
gitea_claims = {}

if request.user.ak_groups.filter(name="Gitea Users").exists():
    gitea_claims["gitea"]= "user"
if request.user.ak_groups.filter(name="Gitea Admins").exists():
    gitea_claims["gitea"]= "admin"
if request.user.ak_groups.filter(name="Gitea Restricted").exists():
    gitea_claims["gitea"]= "restricted"

return gitea_claims
`,
});

const authentikProvider = new authentik.ProviderOauth2("gitea", {
  name: "Gitea",
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
      url: "https://git.sapslaj.cloud/user/oauth2/authentik/callback",
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
    authentikGroupScopeMapping.id,
  ],
});

const authentikApplication = new authentik.Application("gitea", {
  name: "Gitea",
  slug: "gitea",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

new authentik.PolicyBinding("gitea-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const authentikSecret = new kubernetes.core.v1.Secret("gitea-authentik", {
  metadata: {
    name: "gitea-authentik",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.gitea",
    },
  },
  stringData: {
    key: authentikProvider.clientId,
    secret: authentikProvider.clientSecret,
  },
}, { provider });

const valkey = new Valkey("gitea", {
  name: "gitea-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.gitea",
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

const postgresql = new kubernetes.apiextensions.CustomResource("gitea-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "gitea-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.gitea",
    },
  },
  spec: {
    instances: 3,
    enableSuperuserAccess: true,
    bootstrap: {
      initdb: {
        database: "gitea",
        owner: "gitea",
      },
    },
    storage: {
      size: "10Gi",
      storageClass: "shortrack-mitsuru-red",
    },
    monitoring: {
      enablePodMonitor: true,
    },
  },
}, { provider });

const adminSecret = new kubernetes.core.v1.Secret("gitea-admin", {
  metadata: {
    name: "gitea-admin",
    namespace: namespace.metadata.name,
  },
  stringData: {
    username: "admin",
    password: new random.RandomPassword("gitea-admin", {
      length: 64,
    }).result,
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("gitea", {
  chart: "gitea",
  fetchOpts: {
    repo: "https://dl.gitea.com/charts/",
  },
  version: "12.2.0",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    service: {
      ssh: {
        type: "NodePort",
        clusterIP: null,
        nodePort: 30022,
      },
    },
    ingress: {
      enabled: true,
      className: "traefik",
      annotations: {
        "traefik.ingress.kubernetes.io/router.middlewares": "traefik-anubis@kubernetescrd",
      },
      hosts: [
        {
          host: "git.sapslaj.cloud",
          paths: [
            {
              path: "/",
            },
          ],
        },
      ],
    },
    deployment: {
      env: [
        {
          name: "GITEA__DATABASE__HOST",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "host",
            },
          },
        },
        {
          name: "GITEA__DATABASE__NAME",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "dbname",
            },
          },
        },
        {
          name: "GITEA__DATABASE__USER",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "user",
            },
          },
        },
        {
          name: "GITEA__DATABASE__PASSWD",
          valueFrom: {
            secretKeyRef: {
              name: pulumi.concat(postgresql.metadata.name, "-app"),
              key: "password",
            },
          },
        },
      ],
    },
    persistence: {
      enabled: true,
      accessModes: [
        "ReadWriteMany",
      ],
      storageClass: "nfs",
    },
    gitea: {
      admin: {
        existingSecret: adminSecret.metadata.name,
      },
      metrics: {
        enabled: true,
        serviceMonitor: {
          enabled: true,
        },
      },
      oauth: [
        {
          name: "authentik",
          provider: "openidConnect",
          existingSecret: authentikSecret.metadata.name,
          autoDiscoverUrl: "https://login.sapslaj.cloud/application/o/gitea/.well-known/openid-configuration",
          iconUrl: "https://login.sapslaj.cloud/static/dist/assets/icons/icon.png",
          scopes: "email profile gitea",
        },
      ],
      config: {
        server: {
          PROTOCOL: "http",
          ROOT_URL: "https://git.sapslaj.cloud",
        },
        database: {
          DB_TYPE: "postgres",
        },
        queue: {
          TYPE: "redis",
          CONN_STR: pulumi.interpolate`redis://${valkey.readWriteService.metadata.name}:6379/0`,
        },
        admin: {},
        security: {},
        camo: {},
        openid: {
          ENABLE_OPENID_SIGNIN: false,
          ENABLE_OPENID_SIGNUP: false,
        },
        oauth2_client: {
          ENABLE_AUTO_REGISTRATION: true,
          UPDATE_AVATAR: true,
        },
        service: {
          DISABLE_REGISTRATION: true,
        },
        "ssh.minimum_key_sizes": {
          RSA: 2048,
        },
        webhook: {},
        mailer: {},
        cache: {
          ADAPTER: "redis",
          HOST: pulumi.interpolate`redis://${valkey.readWriteService.metadata.name}:6379/2`,
        },
        session: {
          PROVIDER: "redis",
          PROVIDER_CONFIG: pulumi.interpolate`redis://${valkey.readWriteService.metadata.name}:6379/1`,
        },
        picture: {},
        project: {},
      },
    },
    "valkey-cluster": {
      enabled: false,
    },
    valkey: {
      enabled: false,
    },
    "postgresql-ha": {
      enabled: false,
    },
    postgresql: {
      enabled: false,
    },
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("git.sapslaj.cloud");
