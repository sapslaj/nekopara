import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { newK3sProvider, transformSkipIngressAwait } from "../../components/k3s-shared";
import { IngressDNS } from "../../components/k8s/IngressDNS";
import * as authentik from "../../sdks/authentik";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("grafana", {
  metadata: {
    name: "grafana",
  },
}, { provider });

const clientID = new random.RandomId("client-id", {
  byteLength: 16,
});

const authentikGroupAdmins = new authentik.Group("grafana-admins", {
  name: "Grafana Admins",
});

const authentikGroupEditors = new authentik.Group("grafana-editors", {
  name: "Grafana Editors",
});

const authentikGroupViewers = new authentik.Group("grafana-viewers", {
  name: "Grafana Viewers",
});

const authentikProvider = new authentik.ProviderOauth2("grafana", {
  name: "Grafana",
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
      url: "https://grafana.sapslaj.xyz/login/generic_oauth",
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

const authentikApplication = new authentik.Application("grafana", {
  name: "Grafana",
  slug: "grafana",
  protocolProvider: authentikProvider.providerOauth2Id.apply((id) => parseInt(id)),
});

const oauthSecret = new kubernetes.core.v1.Secret("grafana-auth-generic-oauth-secret", {
  metadata: {
    name: "grafana-auth-generic-oauth-secret",
    namespace: namespace.metadata.name,
  },
  stringData: {
    client_id: authentikProvider.clientId,
    client_secret: authentikProvider.clientSecret,
  },
}, { provider });

const grafana = new kubernetes.helm.v3.Chart("grafana", {
  chart: "grafana",
  fetchOpts: {
    repo: "https://grafana.github.io/helm-charts",
  },
  version: "9.2.10",
  namespace: namespace.metadata.name,
  skipCRDRendering: true,
  values: {
    image: {
      registry: "proxy.oci.sapslaj.xyz/docker-hub",
    },
    testFramework: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
    },
    downloadDashboardsImage: {
      registry: "proxy.oci.sapslaj.xyz/docker-hub",
    },
    serviceMonitor: {
      enabled: true,
    },
    ingress: {
      enabled: true,
      hosts: [
        "grafana.sapslaj.xyz",
      ],
    },
    persistence: {
      type: "pvc",
      enabled: true,
      storageClassName: "shortrack-mitsuru-red",
    },
    initChownData: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
    },
    extraSecretMounts: [
      {
        name: "auth-generic-oauth-secret",
        secretName: oauthSecret.metadata.name,
        defaultMode: 400,
        mountPath: "/etc/secrets/auth_generic_oauth",
        readOnly: true,
      },
    ],
    plugins: [
      "victoriametrics-logs-datasource",
    ],
    "grafana.ini": {
      server: {
        root_url: "https://grafana.sapslaj.xyz/",
      },
      auth: {
        signout_redirect_url: pulumi
          .interpolate`https://login.sapslaj.cloud/application/o/${authentikApplication.slug}/end-session/`,
        oauth_auto_login: true,
      },
      "auth.generic_oauth": {
        enabled: true,
        name: "sapslaj cloud login",
        allow_sign_up: true,
        client_id: "$__file{/etc/secrets/auth_generic_oauth/client_id}",
        client_secret: "$__file{/etc/secrets/auth_generic_oauth/client_secret}",
        scopes: "openid profile email",
        auth_url: "https://login.sapslaj.cloud/application/o/authorize/",
        token_url: "https://login.sapslaj.cloud/application/o/token/",
        api_url: "https://login.sapslaj.cloud/application/o/userinfo/",
        role_attribute_path:
          "contains(groups, 'Grafana Admins') && 'Admin' || contains(groups, 'Grafana Editors') && 'Editor' || 'Viewer'",
      },
    },
    sidecar: {
      dashboards: {
        enabled: true,
        searchNamespace: "ALL",
      },
      datasources: {
        enabled: true,
        searchNamespace: "ALL",
      },
      plugins: {
        enabled: true,
        searchNamespace: "ALL",
      },
    },
    imageRenderer: {
      image: {
        registry: "proxy.oci.sapslaj.xyz/docker-hub",
      },
    },
    useStatefulSet: true,
    assertNoLeakedSecrets: false,
  },
  transformations: [
    (obj: any, opts: pulumi.CustomResourceOptions) => {
      if (obj.kind === "Secret" && obj.metadata?.name === "grafana") {
        opts.ignoreChanges = [
          ...(opts.ignoreChanges ?? []),
          "data.admin-password",
        ];
      }
      if (obj.kind === "Role" && obj.metadata?.name === "grafana") {
        if (Array.isArray(obj.rules) && obj.rules.length === 0) {
          obj.rules = null;
        }
      }
      if (obj.kind === "StatefulSet" && obj.metadata?.name === "grafana") {
        opts.ignoreChanges = [
          ...(opts.ignoreChanges ?? []),
          `spec.template.metadata.annotations.["checksum/secret"]`,
        ];
      }
    },
  ],
}, {
  provider,
  transforms: [
    transformSkipIngressAwait(),
  ],
});

new IngressDNS("grafana.sapslaj.xyz", {
  hostname: "grafana.sapslaj.xyz",
}, {
  providers: {
    kubernetes: provider,
  },
});
