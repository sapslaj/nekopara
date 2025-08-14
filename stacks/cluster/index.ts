import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as tls from "@pulumi/tls";
import * as mid from "@sapslaj/pulumi-mid";

import { Distro, IDistro } from "../../components/homelab-config";
import { BaselineUsers } from "../../components/mid/BaselineUsers";
import { MidTarget } from "../../components/mid/MidTarget";
import { CloudImageTrait } from "../../components/proxmox-vm/CloudImageTrait";
import { PrivateKeyTrait } from "../../components/proxmox-vm/PrivateKeyTrait";
import { ProxmoxVM, ProxmoxVMDiskConfig, ProxmoxVMProps } from "../../components/proxmox-vm/ProxmoxVM";
import { DNSRecord } from "../../components/shimiko";

interface ControlPlaneNodeProps {
  k3sVersion: pulumi.Input<string>;
  k3sToken: pulumi.Input<string>;
  dnsHostName: pulumi.Input<string>;
  dnsFullName: pulumi.Input<string>;
  serverUri: pulumi.Input<string>;
  privateKey: tls.PrivateKey;
  distro: IDistro;
  labels?: Record<string, pulumi.Input<string>>;
  taints?: Record<string, pulumi.Input<string>>;
  nodeConfig?: ProxmoxVMProps;
  diskConfig?: Partial<ProxmoxVMDiskConfig>;
  serverArgs?: pulumi.Input<string>[];
  keepers?: Record<string, pulumi.Input<string>>;
}

class ControlPlaneNode extends pulumi.ComponentResource {
  vm: ProxmoxVM;
  randomId: random.RandomId;
  service: mid.resource.SystemdService;

  constructor(id: string, props: ControlPlaneNodeProps, opts: pulumi.ComponentResourceOptions = {}) {
    super("sapslaj:k3s:ControlPlaneNode", id, {}, opts);

    this.randomId = new random.RandomId(id, {
      byteLength: 4,
      keepers: {
        k3sVersion: props.k3sVersion,
        labels: JSON.stringify(props.labels),
        taints: JSON.stringify(props.taints),
        ...props.keepers,
      },
    }, {
      parent: this,
    });

    this.vm = new ProxmoxVM(id, {
      name: pulumi.all({
        randomIdResult: this.randomId.id,
        dnsHostName: props.dnsHostName,
      }).apply(
        ({ randomIdResult, dnsHostName }) => {
          const nodeId = randomIdResult
            .replace(/['\"!@#$%^&\*\(\)\[\]\{\};:\,\./<>\?\|`~=_\-+ ]/g, "")
            .toLowerCase()
            .replace(/\-+$/, "")
            .replace(/^\-+/, "");
          return [
            dnsHostName,
            id,
            nodeId,
          ].join("-");
        },
      ),
      traits: [
        new CloudImageTrait("cloud-image", {
          downloadFileConfig: {
            url: Distro.UBUNTU_24_04.url,
          },
          diskConfig: {
            size: 32,
            ...props.diskConfig,
          },
        }),
        new PrivateKeyTrait("private-key", {
          privateKey: props.privateKey,
          addPrivateKeyToUserdata: true,
        }),
        ...(props.nodeConfig?.traits ?? []),
      ],
      connectionArgs: {
        user: props.distro.username,
        ...props.nodeConfig?.connectionArgs,
      },
      cpu: {
        cores: 4,
        ...props.nodeConfig?.cpu,
      },
      memory: {
        dedicated: 4096,
        ...props.nodeConfig?.memory,
      },
      ...props.nodeConfig,
    }, {
      parent: this,
    });

    new MidTarget(`${id}-mid-target`, {
      connection: this.vm.connection,
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    new BaselineUsers(`${id}-baseline-users`, {
      connection: this.vm.connection,
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    const nodeLabels: Record<string, pulumi.Input<string>> = props.labels ?? {};
    if (nodeLabels["topology.kubernetes.io/zone"] === undefined) {
      nodeLabels["topology.kubernetes.io/zone"] = this.vm.nodeName;
    }

    const nodeServerArgs: pulumi.Input<string>[] = [
      ...(props.serverArgs ?? []),
    ];

    nodeServerArgs.push("--tls-san", props.dnsFullName);

    nodeServerArgs.push(
      pulumi.output(props.serverUri).apply((server) => {
        if (server === "cluster-init") {
          return "--cluster-init";
        }

        return `--server ${server}`;
      }),
    );

    for (const [key, value] of Object.entries(nodeLabels)) {
      nodeServerArgs.push("--node-label", pulumi.interpolate`${key}=${value}`);
    }
    for (const [key, value] of Object.entries(props.taints ?? {})) {
      nodeServerArgs.push("--node-taint", pulumi.interpolate`${key}=${value}`);
    }

    const netipv4ipforward = new mid.resource.FileLine(`${id}-netipv4ipforward`, {
      connection: this.vm.connection,
      path: "/etc/sysctl.conf",
      line: "net.ipv4.ip_forward = 1",
      regexp: "^net\\.ipv4\\.ip_forward =",
    }, {
      parent: this,
      retainOnDelete: true,
    });

    const netipv6confallforwarding = new mid.resource.FileLine(`${id}-netipv6confallforwarding`, {
      connection: this.vm.connection,
      path: "/etc/sysctl.conf",
      line: "net.ipv6.conf.all.forwarding = 1",
      regexp: "^net\\.ipv6\\.conf\\.all\\.forwarding =",
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
      dependsOn: [
        netipv4ipforward,
      ],
    });

    const sysctlReload = new mid.resource.Exec(`${id}-sysctl-reload`, {
      connection: this.vm.connection,
      create: {
        command: ["sysctl", "--system"],
      },
      update: {
        command: ["sysctl", "--system"],
      },
      delete: {
        command: ["sysctl", "--system"],
      },
      triggers: {
        refresh: [
          netipv4ipforward.triggers.lastChanged,
          netipv6confallforwarding.triggers.lastChanged,
        ],
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
      dependsOn: [
        netipv6confallforwarding,
      ],
    });

    const k3sBinary = new mid.resource.File(`${id}-k3s-binary`, {
      connection: this.vm.connection,
      path: "/usr/local/bin/k3s",
      remoteSource: pulumi.interpolate`https://github.com/k3s-io/k3s/releases/download/${props.k3sVersion}/k3s`,
      owner: "root",
      group: "root",
      mode: "0755",
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    const k3sServiceEnv = new mid.resource.File(`${id}-k3s-service-env`, {
      connection: this.vm.connection,
      path: "/etc/systemd/system/k3s.service.env",
      content: pulumi.concat(
        pulumi.interpolate`K3S_TOKEN='${props.k3sToken}'\n`,
      ),
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    const k3sServiceUnit = new mid.resource.File(`${id}-k3s-service-unit`, {
      connection: this.vm.connection,
      path: "/etc/systemd/system/k3s.service",
      content: pulumi.concat(
        "[Unit]\n",
        "Description=Lightweight Kubernetes\n",
        "Documentation=https://k3s.io\n",
        "Wants=network-online.target\n",
        "After=network-online.target\n",
        "\n",
        "[Install]\n",
        "WantedBy=multi-user.target\n",
        "\n",
        "[Service]\n",
        "Type=notify\n",
        pulumi.interpolate`EnvironmentFile=${k3sServiceEnv.path}\n`,
        "KillMode=process\n",
        "Delegate=yes\n",
        "LimitNOFILE=1048576\n",
        "LimitNPROC=infinity\n",
        "LimitCORE=infinity\n",
        "TasksMax=infinity\n",
        "TimeoutStartSec=0\n",
        "Restart=always\n",
        "RestartSec=5s\n",
        "ExecStartPre=/bin/sh -xc '! /usr/bin/systemctl is-enabled --quiet nm-cloud-setup.service'\n",
        "ExecStartPre=-/sbin/modprobe br_netfilter\n",
        "ExecStartPre=-/sbin/modprobe overlay\n",
        pulumi.interpolate`ExecStart=/usr/local/bin/k3s server --data-dir /var/lib/rancher/k3s `,
        pulumi.output(nodeServerArgs).apply((args) => args.join(" ")),
        "\n",
      ),
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    this.service = new mid.resource.SystemdService(`${id}-k3s`, {
      connection: this.vm.connection,
      name: "k3s.service",
      ensure: "started",
      enabled: true,
      daemonReload: true,
      triggers: {
        refresh: [
          sysctlReload.triggers.lastChanged,
          k3sBinary.triggers.lastChanged,
          k3sServiceEnv.triggers.lastChanged,
          k3sServiceUnit.triggers.lastChanged,
        ],
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });
  }
}

interface NLBNodeProps {
  privateKey: tls.PrivateKey;
  distro: IDistro;
  dnsHostName: pulumi.Input<string>;
  controlPlaneNodes: Record<string, ControlPlaneNode>;
  ports: Record<string, number>;
  nodeConfig?: ProxmoxVMProps;
  diskConfig?: Partial<ProxmoxVMDiskConfig>;
  keepers?: Record<string, pulumi.Input<string>>;
}

class NLBNode extends pulumi.ComponentResource {
  vm: ProxmoxVM;
  randomId: random.RandomId;
  service: mid.resource.SystemdService;

  constructor(id: string, props: NLBNodeProps, opts: pulumi.ComponentResourceOptions = {}) {
    super("sapslaj:k3s:NLBNode", id, {}, opts);

    this.randomId = new random.RandomId(id, {
      byteLength: 4,
      keepers: {
        ...props.keepers,
      },
    }, {
      parent: this,
    });

    this.vm = new ProxmoxVM(id, {
      name: pulumi.all({
        randomIdResult: this.randomId.id,
        dnsHostName: props.dnsHostName,
      }).apply(
        ({ randomIdResult, dnsHostName }) => {
          const nodeId = randomIdResult
            .replace(/['\"!@#$%^&\*\(\)\[\]\{\};:\,\./<>\?\|`~=_\-+ ]/g, "")
            .toLowerCase()
            .replace(/\-+$/, "")
            .replace(/^\-+/, "");
          return [
            dnsHostName,
            id,
            nodeId,
          ].join("-");
        },
      ),
      traits: [
        new CloudImageTrait("cloud-image", {
          downloadFileConfig: {
            url: Distro.UBUNTU_24_04.url,
          },
          diskConfig: {
            size: 16,
            ...props.diskConfig,
          },
        }),
        new PrivateKeyTrait("private-key", {
          privateKey: props.privateKey,
          addPrivateKeyToUserdata: true,
        }),
        ...(props.nodeConfig?.traits ?? []),
      ],
      connectionArgs: {
        user: props.distro.username,
        ...props.nodeConfig?.connectionArgs,
      },
      cpu: {
        cores: 2,
        ...props.nodeConfig?.cpu,
      },
      memory: {
        dedicated: 1024,
        ...props.nodeConfig?.memory,
      },
      ...props.nodeConfig,
    }, {
      parent: this,
    });

    const midTarget = new MidTarget(`${id}-mid-target`, {
      connection: this.vm.connection,
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    new BaselineUsers(`${id}-baseline-users`, {
      connection: this.vm.connection,
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
    });

    const haproxyPackage = new mid.resource.Apt(`${id}-haproxy`, {
      connection: this.vm.connection,
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
      name: "haproxy",
    }, {
      parent: this,
      deletedWith: this.vm,
      dependsOn: [
        midTarget,
      ],
    });

    const configFragments: pulumi.Input<string>[] = [
      `global\n`,
      `  log /dev/log local0\n`,
      `  log /dev/log local1 notice\n`,
      `  chroot /var/lib/haproxy\n`,
      `  stats socket /run/haproxy/admin.sock mode 660 level admin\n`,
      `  stats timeout 30s\n`,
      `  user haproxy\n`,
      `  group haproxy\n`,
      `  daemon\n`,
      `\n`,
      `defaults\n`,
      `  log global\n`,
      `  mode tcp\n`,
      `  timeout connect 5000\n`,
      `  timeout client 50000\n`,
      `  timeout server 50000\n`,
      `\n`,
    ];

    for (const [portName, port] of Object.entries(props.ports)) {
      configFragments.push(`frontend ${portName}_frontend\n`);
      configFragments.push(`  mode tcp\n`);
      configFragments.push(`  bind :${port}\n`);
      configFragments.push(`  default_backend ${portName}_backend\n`);
      configFragments.push(`\n`);
      configFragments.push(`backend ${portName}_backend\n`);
      configFragments.push(`  mode tcp\n`);
      configFragments.push(`  balance leastconn\n`);

      for (const [nodeID, node] of Object.entries(props.controlPlaneNodes)) {
        configFragments.push(pulumi.interpolate`  server ${nodeID} ${node.vm.ipv4}:${port} check\n`);
      }

      configFragments.push(`\n`);
    }

    const haproxyConfig = new mid.resource.File(`${id}-haproxy-config`, {
      connection: this.vm.connection,
      triggers: {
        replace: [
          this.randomId.id,
        ],
      },
      path: "/etc/haproxy/haproxy.cfg",
      content: pulumi.concat(...configFragments),
    }, {
      parent: this,
      deletedWith: this.vm,
      dependsOn: [
        haproxyPackage,
      ],
    });

    this.service = new mid.resource.SystemdService(`${id}-haproxy`, {
      connection: this.vm.connection,
      name: "haproxy.service",
      enabled: true,
      ensure: "started",
      triggers: {
        refresh: [
          haproxyConfig.triggers.lastChanged,
        ],
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      deletedWith: this.vm,
      dependsOn: [
        haproxyConfig,
        haproxyPackage,
      ],
    });
  }
}

export const k3sToken = new random.RandomPassword("k3s-token", {
  length: 64,
  special: false,
}).result;

export const dnsHostName = pulumi.getStack() === "prod" ? "nekopara" : `nekopara-${pulumi.getStack()}`;

export const dnsFullName = `${dnsHostName}.sapslaj.xyz`;

export const serverUri = `https://${dnsFullName}:6443`;

const privateKey = new tls.PrivateKey("control-plane", {
  algorithm: "ED25519",
  ecdsaCurve: "P256",
});

const nodes: Record<string, ControlPlaneNode> = {};

nodes["c1"] = new ControlPlaneNode("c1", {
  k3sToken,
  dnsHostName,
  dnsFullName,
  privateKey,
  k3sVersion: "v1.32.7+k3s1",
  distro: Distro.UBUNTU_24_04,
  serverUri: pulumi.interpolate`https://172.24.4.123:6443`,
  serverArgs: [
    "--disable-helm-controller",
    "--disable traefik",
    "--disable coredns",
    "--disable local-storage",
    "--disable metrics-server",
    "--write-kubeconfig-mode 644",
  ],
  labels: {
    "k3s.sapslaj.xyz/role": "control-plane",
    "topology.kubernetes.io/region": "homelab",
  },
  taints: {
    "k3s.sapslaj.xyz/role": "control-plane:NoSchedule",
  },
  nodeConfig: {
    cpu: {
      cores: 4,
    },
    memory: {
      dedicated: 4096,
    },
  },
});

nodes["c2"] = new ControlPlaneNode("c2", {
  k3sToken,
  dnsHostName,
  dnsFullName,
  privateKey,
  k3sVersion: "v1.32.7+k3s1",
  distro: Distro.UBUNTU_24_04,
  serverUri: pulumi.interpolate`https://172.24.4.136:6443`,
  serverArgs: [
    "--disable-helm-controller",
    "--disable traefik",
    "--disable coredns",
    "--disable local-storage",
    "--disable metrics-server",
    "--write-kubeconfig-mode 644",
  ],
  labels: {
    "k3s.sapslaj.xyz/role": "control-plane",
    "topology.kubernetes.io/region": "homelab",
  },
  taints: {
    "k3s.sapslaj.xyz/role": "control-plane:NoSchedule",
  },
  nodeConfig: {
    cpu: {
      cores: 4,
    },
    memory: {
      dedicated: 4096,
    },
  },
}, {
  dependsOn: nodes["c1"].service,
});

nodes["c3"] = new ControlPlaneNode("c3", {
  k3sToken,
  dnsHostName,
  dnsFullName,
  privateKey,
  k3sVersion: "v1.32.7+k3s1",
  distro: Distro.UBUNTU_24_04,
  serverUri: pulumi.interpolate`https://172.24.4.142:6443`,
  serverArgs: [
    "--disable-helm-controller",
    "--disable traefik",
    "--disable coredns",
    "--disable local-storage",
    "--disable metrics-server",
    "--write-kubeconfig-mode 644",
  ],
  labels: {
    "k3s.sapslaj.xyz/role": "control-plane",
    "topology.kubernetes.io/region": "homelab",
  },
  taints: {
    "k3s.sapslaj.xyz/role": "control-plane:NoSchedule",
  },
  nodeConfig: {
    cpu: {
      cores: 4,
    },
    memory: {
      dedicated: 4096,
    },
  },
}, {
  dependsOn: nodes["c2"].service,
});

const nlbs: Record<string, NLBNode> = {};

for (let i = 1; i <= 2; i++) {
  nlbs[`nlba-${i}`] = new NLBNode(`nlba-${i}`, {
    dnsHostName,
    privateKey,
    distro: Distro.UBUNTU_24_04,
    controlPlaneNodes: nodes,
    ports: {
      http: 80,
      https: 443,
      k3s: 6443,
    },
  }, {
    dependsOn: Object.values(nlbs),
  });
}

new DNSRecord("server", {
  name: dnsHostName,
  type: "A",
  records: Object.values(nlbs).map((node) => node.vm.ipv4),
});

export let kubeconfig: pulumi.Output<string> | undefined;

if (Object.keys(nodes).length > 0) {
  const first = Object.keys(nodes)[0];
  const kubeconfigSlurp = new mid.resource.Exec("kubeconfig-slurp", {
    connection: nodes[first].vm.connection,
    create: {
      command: [
        "/bin/bash",
        "-c",
        "for i in {1..10}; do test -f /etc/rancher/k3s/k3s.yaml && break || sleep 10; done; cat /etc/rancher/k3s/k3s.yaml",
      ],
    },
  }, {
    retainOnDelete: true,
    dependsOn: [
      nodes[first].service,
    ],
  });

  kubeconfig = kubeconfigSlurp.stdout.apply((stdout) => {
    return stdout.replace("https://127.0.0.1:6443", serverUri);
  });
}
