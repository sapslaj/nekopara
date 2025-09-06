import * as fs from "fs";
import * as path from "path";

import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as YAML from "yaml";

import { newK3sProvider } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import { Valkey } from "../../components/k8s/Valkey";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("traefik", {
  metadata: {
    name: "traefik",
  },
}, { provider });

const iamUser = new aws.iam.User(`traefik-nekopara-${pulumi.getStack()}`, {});

new aws.iam.UserPolicyAttachment("traefik-route53", {
  user: iamUser.name,
  policyArn: "arn:aws:iam::aws:policy/AmazonRoute53FullAccess",
});

const awsSecret = new kubernetes.core.v1.Secret("traefik-aws", {
  metadata: {
    name: "traefik-aws",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/managed-by": "Pulumi",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
    annotations: {
      "aws-credentials-secret-injector.sapslaj.cloud/user-name": iamUser.name,
      "aws-credentials-secret-injector.sapslaj.cloud/ttl": "730h",
      "aws-credentials-secret-injector.sapslaj.cloud/maintenance-time": "06:00:00",
    },
  },
}, {
  provider,
  ignoreChanges: [
    "data",
    "stringData",
  ],
});

const traefik = new kubernetes.helm.v3.Chart("traefik", {
  chart: "traefik",
  version: "36.3.0",
  fetchOpts: {
    repo: "https://traefik.github.io/charts",
  },
  skipCRDRendering: true,
  namespace: namespace.metadata.name,
  values: {
    image: {
      registry: "public.ecr.aws/docker/library",
    },
    deployment: {
      enabled: true,
      kind: "DaemonSet",
      annotations: {
        "reloader.stakater.com/auto": "true",
        "reloader.stakater.com/rollout-strategy": "restart",
      },
      initContainers: [
        {
          name: "volume-permissions",
          image: "busybox:1.31.1",
          command: [
            "sh",
            "-c",
            "touch /data/acme.json && chmod -Rv 600 /data/* && chown 65532:65532 /data/acme.json",
          ],
          volumeMounts: [
            {
              name: "traefik-data",
              mountPath: "/data",
            },
          ],
        },
      ],
    },
    podDisruptionBudget: {
      enabled: true,
      minAvailable: 1,
    },
    ingressClass: {
      enabled: true,
      isDefaultClass: true,
    },
    updateStrategy: {
      type: "RollingUpdate",
      rollingUpdate: {
        maxUnavailable: 1,
        maxSurge: null,
      },
    },
    providers: {
      kubernetesCRD: {
        enabled: true,
        allowCrossNamespace: true,
        allowExternalNameServices: true,
      },
      kubernetesIngress: {
        enabled: true,
        allowExternalNameServices: true,
      },
      kubernetesGateway: {
        enabled: false,
      },
    },
    logs: {
      general: {
        format: "json",
      },
      access: {
        enabled: true,
        format: "json",
        fields: {
          headers: {
            defaultmode: "keep",
            names: {
              "Authorization": "redact",
              "Cookie": "redact",
              "Proxy-Authorization": "redact",
              "Set-Cookie": "redact",
            },
          },
        },
      },
    },
    metrics: {
      service: {
        enabled: true,
      },
      serviceMonitor: {
        enabled: true,
      },
      prometheusRule: {
        enabled: true,
      },
    },
    tracing: {
      otlp: {
        enabled: true,
        grpc: {
          enabled: true,
          endpoint: "jaeger-collector.jaeger.svc.cluster.local:4317",
          insecure: true,
        },
      },
    },
    global: {
      checkNewVersion: false,
      sendAnonymousUsage: false,
    },
    env: [
      {
        name: "AWS_REGION",
        value: "us-east-1",
      },
    ],
    envFrom: [
      {
        secretRef: {
          name: awsSecret.metadata.name,
        },
      },
    ],
    ports: {
      web: {
        hostPort: 80,
        redirections: {
          entryPoint: {
            to: "websecure",
            scheme: "https",
            permanent: true,
          },
        },
      },
      websecure: {
        hostPort: 443,
        tls: {
          enabled: true,
          certResolver: "letsencrypt",
          domains: [
            {
              main: "*.sapslaj.xyz",
            },
            {
              main: "sapslaj.cloud",
              sans: [
                pulumi.interpolate`*.sapslaj.cloud`,
              ],
            },
          ],
        },
      },
      metrics: {
        port: 9182,
      },
    },
    service: {
      enabled: false,
    },
    persistence: {
      enabled: true,
      name: "traefik-data",
      accessMode: "ReadWriteMany",
      size: "1Gi",
      storageClass: "nfs",
    },
    certificatesResolvers: {
      letsencrypt: {
        acme: {
          email: "alerts@sapslaj.com",
          caServer: "https://acme-v02.api.letsencrypt.org/directory",
          dnsChallenge: {
            provider: "route53",
            resolvers: [
              "1.1.1.1:53",
              "8.8.8.8:53",
            ],
          },
          storage: "/data/acme.json",
        },
      },
    },
    nodeSelector: {
      "k3s.sapslaj.xyz/role": "ingress",
    },
    tolerations: [
      {
        effect: "NoSchedule",
        key: "k3s.sapslaj.xyz/role",
        operator: "Exists",
      },
    ],
    topologySpreadConstraints: [
      {
        maxSkew: 1,
        topologyKey: "kubernetes.io/hostname",
        whenUnsatisfiable: "ScheduleAnyway",
        labelSelector: {
          matchLabels: {
            "app.kubernetes.io/name": `{{ template "traefik.name" . }}`,
          },
        },
      },
    ],
  },
}, {
  provider,
});

const allowList = new kubernetes.apiextensions.CustomResource("traefik-dashboard-ipallowlist", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "traefik-dashboard-ipallowlist",
    namespace: namespace.metadata.name,
  },
  spec: {
    ipAllowList: {
      sourceRange: [
        "100.64.0.0/10",
        "172.24.4.0/24",
        "172.24.5.0/24",
      ],
    },
  },
}, { provider });

new kubernetes.apiextensions.CustomResource("traefik-dashboard", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "IngressRoute",
  metadata: {
    name: "traefik-dashboard",
    namespace: namespace.metadata.name,
  },
  spec: {
    routes: [
      {
        match: "Host(`traefik.sapslaj.xyz`)",
        kind: "Rule",
        middlewares: [
          {
            name: allowList.metadata.name,
            namespace: allowList.metadata.namespace,
          },
        ],
        services: [
          {
            name: "api@internal",
            kind: "TraefikService",
          },
        ],
      },
    ],
  },
}, {
  provider,
});

new IngressDNS("traefik.sapslaj.xyz");

const anubisValkey = new Valkey("anubis-valkey", {
  name: "anubis-valkey",
  namespace: namespace.metadata.name,
  labels: {
    "app.kubernetes.io/component": "anubis-valkey",
    "app.kubernetes.io/instance": "anubis",
    "app.kubernetes.io/name": "anubis-valkey",
    "app.kubernetes.io/managed-by": "Pulumi",
    "app.kubernetes.io/part-of": "traefik",
    "k3s.sapslaj.xyz/stack": "nekopara.traefik",
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

const anubisKey = new kubernetes.core.v1.Secret("anubis-key", {
  metadata: {
    name: "anubis-key",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis-key",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "traefik",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
  },
  stringData: {
    ED25519_PRIVATE_KEY_HEX: new random.RandomBytes("anubis-key", {
      length: 32,
    }).hex,
  },
}, { provider });

const anubisService = new kubernetes.core.v1.Service("anubis", {
  metadata: {
    name: "anubis",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "traefik",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
  },
  spec: {
    selector: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis",
      "app.kubernetes.io/part-of": "traefik",
    },
    ports: [
      {
        name: "http",
        port: 8923,
        targetPort: 8923,
        protocol: "TCP",
      },
      {
        name: "metrics",
        port: 9090,
        targetPort: 9090,
        protocol: "TCP",
      },
    ],
  },
}, { provider });

const anubisConfig = new kubernetes.core.v1.ConfigMap("anubis", {
  metadata: {
    name: "anubis",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "traefik",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
  },
  data: {
    "botPolicy.yaml": anubisValkey.readWriteService.metadata.name.apply((serviceName) => {
      const policy = YAML.parse(
        fs.readFileSync(
          path.join(__dirname, "anubis-bot-policy.yaml"),
          {
            encoding: "utf-8",
          },
        ),
      );
      policy.store = {
        backend: "valkey",
        parameters: {
          url: `redis://${serviceName}:6379/0`,
        },
      };
      return YAML.stringify(policy);
    }),
  },
}, { provider });

const anubisDeployment = new kubernetes.apps.v1.Deployment("anubis", {
  metadata: {
    name: "anubis",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "traefik",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
  },
  spec: {
    replicas: 2,
    selector: {
      matchLabels: {
        "app.kubernetes.io/component": "anubis",
        "app.kubernetes.io/instance": "anubis",
        "app.kubernetes.io/name": "anubis",
        "app.kubernetes.io/part-of": "traefik",
      },
    },
    template: {
      metadata: {
        labels: {
          "app.kubernetes.io/component": "anubis",
          "app.kubernetes.io/instance": "anubis",
          "app.kubernetes.io/name": "anubis",
          "app.kubernetes.io/managed-by": "Pulumi",
          "app.kubernetes.io/part-of": "traefik",
          "k3s.sapslaj.xyz/stack": "nekopara.traefik",
        },
      },
      spec: {
        volumes: [
          {
            name: "config",
            configMap: {
              name: anubisConfig.metadata.name,
            },
          },
        ],
        containers: [
          {
            name: "anubis",
            image: "ghcr.io/techarohq/anubis:main",
            imagePullPolicy: "Always",
            volumeMounts: [
              {
                name: "config",
                mountPath: "/data/cfg",
              },
            ],
            env: [
              {
                name: "PUBLIC_URL",
                value: "https://anubis.sapslaj.cloud",
              },
              {
                name: "TARGET",
                value: " ",
              },
              {
                name: "POLICY_FNAME",
                value: "/data/cfg/botPolicy.yaml",
              },
              {
                name: "REDIRECT_DOMAINS",
                value: "*.sapslaj.cloud",
              },
              {
                name: "COOKIE_DYNAMIC_DOMAIN",
                value: "true",
              },
              {
                name: "ED25519_PRIVATE_KEY_HEX",
                valueFrom: {
                  secretKeyRef: {
                    name: anubisKey.metadata.name,
                    key: "ED25519_PRIVATE_KEY_HEX",
                  },
                },
              },
            ],
            ports: [
              {
                name: "http",
                protocol: "TCP",
                containerPort: 8923,
              },
              {
                name: "metrics",
                protocol: "TCP",
                containerPort: 9090,
              },
            ],
            resources: {
              limits: {
                cpu: "1",
                memory: "256Mi",
              },
              requests: {
                cpu: "250m",
                memory: "256Mi",
              },
            },
            securityContext: {
              runAsUser: 1000,
              runAsGroup: 1000,
              runAsNonRoot: true,
              allowPrivilegeEscalation: false,
              capabilities: {
                drop: [
                  "ALL",
                ],
              },
              seccompProfile: {
                type: "RuntimeDefault",
              },
            },
            livenessProbe: {
              httpGet: {
                port: "metrics",
                path: "/healthz",
              },
            },
            readinessProbe: {
              httpGet: {
                port: "http",
                path: "/",
                httpHeaders: [
                  {
                    name: "X-Real-IP",
                    value: "127.0.0.1",
                  },
                ],
              },
            },
          },
        ],
      },
    },
  },
}, { provider });

new kubernetes.apiextensions.CustomResource("anubis-servicemonitor", {
  apiVersion: "monitoring.coreos.com/v1",
  kind: "ServiceMonitor",
  metadata: {
    name: "anubis",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "traefik",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
  },
  spec: {
    selector: {
      matchLabels: anubisService.spec.selector,
    },
    endpoints: [
      {
        port: "metrics",
        interval: "30s",
        scrapeTimeout: "10s",
        path: "/metrics",
      },
    ],
  },
}, { provider });

const anubisIngress = new kubernetes.networking.v1.Ingress("traefik-anubis", {
  metadata: {
    name: "anubis",
    namespace: namespace.metadata.name,
    labels: {
      "app.kubernetes.io/component": "anubis",
      "app.kubernetes.io/instance": "anubis",
      "app.kubernetes.io/name": "anubis",
      "app.kubernetes.io/managed-by": "Pulumi",
      "app.kubernetes.io/part-of": "traefik",
      "k3s.sapslaj.xyz/stack": "nekopara.traefik",
    },
    annotations: {
      "pulumi.com/skipAwait": "true",
    },
  },
  spec: {
    ingressClassName: "traefik",
    rules: [
      {
        host: "anubis.sapslaj.cloud",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: anubisService.metadata.name,
                  port: {
                    name: "http",
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
}, { provider });

const anubisMiddleware = new kubernetes.apiextensions.CustomResource("anubis-middleware", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "anubis",
    namespace: namespace.metadata.name,
  },
  spec: {
    forwardAuth: {
      address: "http://anubis.traefik.svc.cluster.local:8923/.within.website/x/cmd/anubis/api/check",
    },
  },
}, { provider });

new IngressDNS("anubis.sapslaj.cloud");
