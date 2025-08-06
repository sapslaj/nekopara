import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as time from "@pulumiverse/time";
import * as YAML from "yaml";

import { getDnsFullName, getDnsHostName, newK3sProvider } from "../../components/k3s-shared";

const provider = newK3sProvider();

const dnsFullName = getDnsFullName();
const dnsHostName = getDnsHostName();

const namespace = new kubernetes.core.v1.Namespace("traefik", {
  metadata: {
    name: "traefik",
  },
}, { provider });

const iamUser = new aws.iam.User(`traefik-nekopara-${pulumi.getStack()}`, {});

const iamKeyRotation = new time.Rotating("traefik-iam-key", {
  rotationDays: 30,
});

const iamKey = new aws.iam.AccessKey("traefik", {
  user: iamUser.name,
}, {
  deleteBeforeReplace: false,
  dependsOn: [iamKeyRotation],
});

new aws.iam.UserPolicyAttachment("traefik-route53", {
  user: iamUser.name,
  policyArn: "arn:aws:iam::aws:policy/AmazonRoute53FullAccess",
});

const awsSecret = new kubernetes.core.v1.Secret("traefik-aws", {
  metadata: {
    name: "traefik-aws",
    namespace: namespace.metadata.name,
  },
  stringData: {
    AWS_ACCESS_KEY_ID: iamKey.id,
    AWS_SECRET_ACCESS_KEY: iamKey.secret,
  },
}, {
  provider,
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
      replicas: 4,
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
    // tracing: {
    //   otlp: {
    //     enabled: true,
    //     grpc: {
    //       enabled: true,
    //       endpoint: "signoz-otel-collector.signoz.svc.cluster.local:4317",
    //       insecure: true,
    //     },
    //   },
    // },
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
        redirections: {
          entryPoint: {
            to: "websecure",
            scheme: "https",
            permanent: true,
          },
        },
      },
      websecure: {
        tls: {
          enabled: true,
          certResolver: "letsencrypt",
          domains: [
            {
              main: dnsFullName,
              sans: [
                pulumi.interpolate`*.sapslaj.xyz`,
                pulumi.interpolate`*.${dnsHostName}.sapslaj.xyz`,
              ],
            },
          ],
        },
      },
    },
    service: {
      enabled: true,
      annotations: {
        "svccontroller.k3s.cattle.io/tolerations": YAML.stringify([
          {
            effect: "NoSchedule",
            key: "k3s.sapslaj.xyz/role",
            operator: "Exists",
          },
        ]),
      },
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
    affinity: {
      podAntiAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight: 100,
            podAffinityTerm: {
              topologyKey: "kubernetes.io/hostname",
              labelSelector: {
                matchLabels: {
                  "app.kubernetes.io/name": `{{ template "traefik.name" . }}`,
                  "app.kubernetes.io/instance": `{{ .Release.Name }}-{{ include "traefik.namespace" . }}`,
                },
              },
            },
          },
        ],
      },
    },
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
