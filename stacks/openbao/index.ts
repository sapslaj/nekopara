import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as vault from "@pulumi/vault";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import * as authentik from "../../sdks/authentik";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("openbao", {
  metadata: {
    name: "openbao",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAccess = new authentik.Group("openbao-access", {
  name: "OpenBao Access",
});

const authentikProvider = new authentik.ProviderOauth2("openbao", {
  name: "OpenBao",
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
      url: "https://openbao.sapslaj.xyz/ui/vault/oidc/oidc/callback",
    },
    {
      matching_mode: "strict",
      url: "https://openbao.sapslaj.xyz/oidc/callback",
    },
    {
      matching_mode: "strict",
      url: "http://localhost:8250/oidc/callback",
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

const authentikApplication = new authentik.Application("openbao", {
  name: "OpenBao",
  slug: "openbao",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

new authentik.PolicyBinding("openbao-access", {
  order: 100,
  target: authentikApplication.uuid,
  group: authentikGroupAccess.id,
});

const allowList = new kubernetes.apiextensions.CustomResource("librenms-ipallowlist", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "openbao-ipallowlist",
    namespace: namespace.metadata.name,
  },
  spec: {
    ipAllowList: {
      sourceRange: [
        "10.42.0.0/16",
        "10.43.0.0/16",
        "172.24.2.0/24",
        "172.24.4.0/24",
        "172.24.5.0/24",
        "100.64.0.0/10",
      ],
    },
  },
}, { provider });

const chart = new kubernetes.helm.v3.Chart("openbao", {
  chart: "openbao",
  fetchOpts: {
    repo: "https://openbao.github.io/openbao-helm",
  },
  version: "0.16.3",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    injector: {
      enabled: false,
    },
    server: {
      enabled: true,
      ingress: {
        enabled: true,
        annotations: {
          "traefik.ingress.kubernetes.io/router.middlewares": pulumi.concat(
            allowList.metadata.namespace,
            "-",
            allowList.metadata.name,
            "@kubernetescrd",
          ),
        },
        ingressClassName: "traefik",
        hosts: [
          {
            host: "openbao.sapslaj.xyz",
            paths: [
              "/",
            ],
          },
        ],
      },
      dataStorage: {
        enabled: true,
        storageClass: "shortrack-mitsuru-red",
      },
      auditStorage: {
        enabled: true,
        storageClass: "shortrack-mitsuru-red",
      },
      ha: {
        enabled: true,
        raft: {
          enabled: true,
        },
      },
    },
    ui: {
      enabled: true,
    },
    serverTelemetry: {
      serviceMonitor: {
        enabled: true,
      },
      prometheusRules: {
        enabled: true,
      },
      grafanaDashboard: {
        enabled: true,
      },
    },
  },
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("openbao.sapslaj.xyz");

new vault.jwt.AuthBackend("oidc", {
  oidcClientId: authentikProvider.clientId,
  oidcClientSecret: authentikProvider.clientSecret,
  oidcDiscoveryUrl: pulumi
    .interpolate`https://login.sapslaj.cloud/application/o/${authentikApplication.slug}/`,
  defaultRole: "reader",
});

new vault.jwt.AuthBackendRole("oidc-reader", {
  roleName: "reader",
  userClaim: "sub",
  boundAudiences: [
    authentikProvider.clientId,
  ],
  allowedRedirectUris: [
    "https://openbao.sapslaj.xyz/ui/vault/oidc/oidc/callback",
    "https://openbao.sapslaj.xyz/oidc/callback",
    "http://localhost:8250/oidc/callback",
  ],
});
