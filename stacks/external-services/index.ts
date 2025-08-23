import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { newK3sProvider } from "../../components/k3s-shared";
import { AuthentikProxyIngress } from "../../components/k8s/AuthentikProxyIngress";
import { IngressDNS } from "../../components/k8s/IngressDNS";

const provider = newK3sProvider();

const namespace = new kubernetes.core.v1.Namespace("external-services", {
  metadata: {
    name: "external-services",
  },
}, { provider });

interface ExternalServiceProps {
  title: pulumi.Input<string>;
  hostname: pulumi.Input<string>;
  name: pulumi.Input<string>;
  namespace: pulumi.Input<string>;
  targetHostname: pulumi.Input<string>;
  targetPort: pulumi.Input<number>;
  authHeader?: boolean;
  authentikProxy?: boolean;
}

class ExternalService extends pulumi.ComponentResource {
  constructor(name: string, props: ExternalServiceProps, opts: pulumi.ComponentResourceOptions = {}) {
    super("sapslaj:nekopara:ExternalService", name, {}, opts);

    new kubernetes.core.v1.Service(name, {
      metadata: {
        name: props.name,
        namespace: props.namespace,
      },
      spec: {
        type: "ExternalName",
        externalName: props.targetHostname,
        ports: [
          {
            name: "http",
            port: props.targetPort,
            targetPort: props.targetPort,
          },
        ],
      },
    }, {
      parent: this,
    });

    if (props.authHeader) {
      new kubernetes.apiextensions.CustomResource(`${name}-middleware-basic-auth`, {
        apiVersion: "traefik.io/v1alpha1",
        kind: "Middleware",
        metadata: {
          name: pulumi.output(props.name).apply((name) => `${name}-basic-auth`),
          namespace: props.namespace,
        },
        spec: {
          headers: {
            customRequestHeaders: {
              Authorization: "Basic YWRtaW46MTIzNDU=",
            },
          },
        },
      }, {
        parent: this,
      });
    }

    if (props.authentikProxy) {
      new AuthentikProxyIngress(name, {
        name: props.title,
        namespace: props.namespace,
        slug: props.name,
        hostname: props.hostname,
        service: {
          kind: "Service",
          name: props.name,
          port: props.targetPort,
        },
        additionalMiddlewares: props.authHeader
          ? [
            {
              name: pulumi.output(props.name).apply((name) => `${name}-basic-auth`),
              namespace: props.namespace,
            },
          ]
          : [],
      }, {
        parent: this,
      });
    } else {
      new kubernetes.apiextensions.CustomResource(`${name}-ingressroute`, {
        apiVersion: "traefik.io/v1alpha1",
        kind: "IngressRoute",
        metadata: {
          name: props.name,
          namespace: props.namespace,
        },
        spec: {
          routes: [
            {
              match: pulumi.concat("Host(`", props.hostname, "`)"),
              kind: "Rule",
              priority: 10,
              services: [
                {
                  namespace: props.namespace,
                  kind: "Service",
                  name: props.name,
                  port: props.targetPort,
                },
              ],
            },
          ],
        },
      }, {
        parent: this,
      });

      new IngressDNS(name, {
        hostname: props.hostname,
      }, {
        parent: this,
      });
    }
  }
}

new ExternalService("lidarr", {
  title: "Lidarr",
  name: "lidarr",
  namespace: namespace.metadata.name,
  hostname: "lidarr.sapslaj.cloud",
  targetHostname: "koyuki.sapslaj.xyz",
  targetPort: 8687,
  authHeader: true,
  authentikProxy: true,
}, {
  providers: {
    kubernetes: provider,
  },
});

new ExternalService("qbittorrent", {
  title: "qBittorrent",
  name: "qbittorrent",
  namespace: namespace.metadata.name,
  hostname: "qbittorrent.sapslaj.cloud",
  targetHostname: "koyuki.sapslaj.xyz",
  targetPort: 8080,
  authHeader: false,
  authentikProxy: true,
}, {
  providers: {
    kubernetes: provider,
  },
});

new ExternalService("radarr", {
  title: "Radarr",
  name: "radarr",
  namespace: namespace.metadata.name,
  hostname: "radarr.sapslaj.cloud",
  targetHostname: "koyuki.sapslaj.xyz",
  targetPort: 7878,
  authHeader: true,
  authentikProxy: true,
}, {
  providers: {
    kubernetes: provider,
  },
});

new ExternalService("sonarr", {
  title: "Sonarr",
  name: "sonarr",
  namespace: namespace.metadata.name,
  hostname: "sonarr.sapslaj.cloud",
  targetHostname: "koyuki.sapslaj.xyz",
  targetPort: 8989,
  authHeader: true,
  authentikProxy: true,
}, {
  providers: {
    kubernetes: provider,
  },
});

new ExternalService("jellyfin", {
  title: "Jellyfin",
  name: "jellyfin",
  namespace: namespace.metadata.name,
  hostname: "jellyfin.sapslaj.cloud",
  targetHostname: "koyuki.sapslaj.xyz",
  targetPort: 8096,
  authHeader: false,
  authentikProxy: false,
}, {
  providers: {
    kubernetes: provider,
  },
});

new ExternalService("homeassistant", {
  title: "homeassistant",
  name: "homeassistant",
  namespace: namespace.metadata.name,
  hostname: "homeassistant.sapslaj.cloud",
  targetHostname: "homeassistant.sapslaj.xyz",
  targetPort: 8123,
  authHeader: false,
  authentikProxy: false,
}, {
  providers: {
    kubernetes: provider,
  },
});
