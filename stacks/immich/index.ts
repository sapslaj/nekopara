import * as docker_build from "@pulumi/docker-build";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as authentik from "@sapslaj/pulumi-authentik";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const postgresqlImage = new docker_build.Image("immich-postgresql", {
  buildArgs: {
    CNPG_TAG: "14",
    PGVECTORS_TAG: "v0.2.0",
    TARGETARCH: "amd64",
  },
  tags: [
    "oci.sapslaj.xyz/immich/postgresql:14",
  ],
  context: {
    location: "./pgvectors",
  },
  cacheFrom: [
    {
      registry: {
        ref: "oci.sapslaj.xyz/immich/postgresql:14",
      },
    },
  ],
  cacheTo: [
    {
      inline: {},
    },
  ],
  platforms: [
    "linux/amd64",
  ],
  push: true,
});

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("immich", {
  metadata: {
    name: "immich",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAccess = new authentik.Group("immich-access", {
  name: "Immich Access",
});

const authentikProvider = new authentik.ProviderOauth2("immich", {
  name: "Immich",
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
      url: "app.immich:///oauth-callback",
    },
    {
      matching_mode: "strict",
      url: "https://photos.sapslaj.cloud/auth/login",
    },
    {
      matching_mode: "strict",
      url: "https://photos.sapslaj.cloud/user-settings",
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

const authentikApplication = new authentik.Application("immich", {
  name: "Immich",
  slug: "immich",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

new authentik.PolicyBinding("immich-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const authentikSecret = new kubernetes.core.v1.Secret("immich-authentik", {
  metadata: {
    name: "immich-authentik",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.immich",
    },
  },
  stringData: {
    key: authentikProvider.clientId,
    secret: authentikProvider.clientSecret,
  },
}, { provider });

const valkey = new Valkey("immich", {
  name: "immich-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/managed-by": "Pulumi",
    "k3s.sapslaj.xyz/stack": "nekopara.immich",
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

const postgresql = new kubernetes.apiextensions.CustomResource("immich-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "immich-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.immich",
    },
  },
  spec: {
    instances: 2,
    enableSuperuserAccess: true,
    bootstrap: {
      initdb: {
        database: "immich",
        owner: "immich",
        postInitApplicationSQL: [
          `CREATE EXTENSION IF NOT EXISTS "vectors";`,
          `CREATE EXTENSION IF NOT EXISTS "cube" CASCADE;`,
          `CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;`,
        ],
        dataChecksums: true,
        encoding: "UTF8",
      },
    },
    managed: {
      roles: [
        {
          name: "immich",
          superuser: true,
          login: true,
        },
      ],
    },
    storage: {
      size: "10Gi",
      storageClass: "shortrack-mitsuru-red",
    },
    imageName: postgresqlImage.tags.apply((tags) => tags![0]),
    postgresql: {
      shared_preload_libraries: [
        "vectors.so",
      ],
    },
    monitoring: {
      enablePodMonitor: true,
    },
  },
}, { provider });

const pvc = new kubernetes.core.v1.PersistentVolumeClaim("immich", {
  metadata: {
    name: "immich",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.immich",
    },
  },
  spec: {
    accessModes: [
      "ReadWriteMany",
    ],
    resources: {
      requests: {
        storage: "10Gi",
      },
    },
    storageClassName: "nfs",
  },
}, { provider });

const chart = new kubernetes.helm.v4.Chart("immich", {
  chart: "oci://ghcr.io/immich-app/immich-charts/immich",
  version: "0.9.3",
  namespace: namespace.metadata.name,
  skipCrds: true,
  values: {
    env: {
      DB_DATABASE_NAME: {
        secretKeyRef: {
          name: pulumi.interpolate`${postgresql.metadata.name}-app`,
          key: "dbname",
        },
      },
      DB_HOSTNAME: {
        secretKeyRef: {
          name: pulumi.interpolate`${postgresql.metadata.name}-app`,
          key: "host",
        },
      },
      DB_PASSWORD: {
        secretKeyRef: {
          name: pulumi.interpolate`${postgresql.metadata.name}-app`,
          key: "password",
        },
      },
      DB_USERNAME: {
        secretKeyRef: {
          name: pulumi.interpolate`${postgresql.metadata.name}-app`,
          key: "username",
        },
      },
      REDIS_HOSTNAME: valkey.readWriteService.metadata.name,
    },
    image: {
      tag: "v1.140.1",
    },
    immich: {
      metrics: {
        enabled: true,
      },
      persistence: {
        library: {
          existingClaim: pvc.metadata.name,
        },
      },
    },
    postgresql: {
      enabled: false,
    },
    redis: {
      enabled: false,
    },
    server: {
      enabled: true,
      ingress: {
        main: {
          enabled: true,
          hosts: [
            {
              host: "photos.sapslaj.cloud",
              paths: [
                {
                  path: "/",
                },
              ],
            },
          ],
        },
      },
    },
    "machine-learning": {
      enabled: true,
      persistence: {
        cache: {
          enabled: true,
          type: "pvc",
          accessMode: "ReadWriteMany",
          storageClass: "nfs",
        },
      },
    },
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("photos.sapslaj.cloud");
