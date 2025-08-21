import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("infisical", {
  metadata: {
    name: "infisical",
  },
}, { provider });

const valkey = new Valkey("infisical", {
  name: "infisical-valkey",
  namespace: namespace.metadata.name,
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

const postgresql = new kubernetes.apiextensions.CustomResource("infisical-postgresql", {
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "infisical-postgresql",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.infisical",
    },
  },
  spec: {
    instances: 2,
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

const encryptionKey = new random.RandomBytes("encryption-key", {
  length: 16,
});

const authSecret = new random.RandomBytes("auth-secret", {
  length: 32,
});

const infisicalSecrets = new kubernetes.core.v1.Secret("infisical", {
  metadata: {
    name: "infisical-secrets",
    namespace: namespace.metadata.name,
  },
  stringData: {
    AUTH_SECRET: authSecret.base64,
    ENCRYPTION_KEY: encryptionKey.hex,
    SITE_URL: "https://infisical.sapslaj.cloud",
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("infisical", {
  chart: "infisical-standalone",
  fetchOpts: {
    repo: "https://dl.cloudsmith.io/public/infisical/helm-charts/helm/charts",
  },
  version: "1.6.1",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    nameOverride: "infisical",
    fullnameOverride: "infisical",
    infisical: {
      enabled: true,
      autoDatabaseSchemaMigration: true,
      autoBootstrap: {
        enabled: false,
      },
      image: {
        repository: "proxy.oci.sapslaj.xyz/docker-hub/infisical/infisical",
      },
    },
    ingress: {
      enabled: true,
      hostName: "infisical.sapslaj.cloud",
      ingressClassName: "traefik",
      nginx: {
        enabled: false,
      },
    },
    postgresql: {
      enabled: false,
      useExistingPostgresSecret: {
        enabled: true,
        existingConnectionStringSecret: {
          name: "infisical-postgresql-app",
          key: "uri",
        },
      },
    },
    redis: {
      enabled: false,
    },
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind === "Deployment" && obj.metadata?.name === "infisical-infisical") {
        delete obj.metadata.annotations["updatedAt"];
        obj.spec.template.spec.containers[0].env.push({
          name: "REDIS_URL",
          value: "redis://infisical-valkey-rw:6379",
        });
      }
    },
  ],
}, {
  provider,
  dependsOn: [
    postgresql,
    valkey,
    infisicalSecrets,
  ],
  transforms: [
    transformSkipIngressAwait(),
  ],
});

const dns = new IngressDNS("infisical", {
  hostname: "infisical.sapslaj.cloud",
});
