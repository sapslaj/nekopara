import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as tls from "@pulumi/tls";
import * as mid from "@sapslaj/pulumi-mid";

import { Distro, IDistro } from "../../components/homelab-config";
import { BaselineUsers } from "../../components/mid/BaselineUsers";
import { MidTarget } from "../../components/mid/MidTarget";
import { SystemdUnit } from "../../components/mid/SystemdUnit";
import { CloudImageTrait } from "../../components/proxmox-vm/CloudImageTrait";
import { DNSRecordTrait } from "../../components/proxmox-vm/DNSRecordTrait";
import { PrivateKeyTrait } from "../../components/proxmox-vm/PrivateKeyTrait";
import { ProxmoxVM, ProxmoxVMDiskConfig, ProxmoxVMProps } from "../../components/proxmox-vm/ProxmoxVM";

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
        new DNSRecordTrait("dns-record", {
          enableIPv6: false,
          lookupIPv6ViaSSH: false,
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

    const nfsCommon = new mid.resource.Apt(`${id}-nfs-common`, {
      connection: this.vm.connection,
      name: "nfs-common",
    }, {
      deletedWith: this.vm,
      parent: this,
    });

    const openiscsi = new mid.resource.Apt(`${id}-open-iscsi`, {
      connection: this.vm.connection,
      name: "open-iscsi",
    }, {
      deletedWith: this.vm,
      parent: this,
    });

    const exosMount = new mid.resource.AnsibleTaskList(`${id}-exos-mount`, {
      connection: this.vm.connection,
      tasks: {
        create: [
          {
            module: "mount",
            args: {
              src: "172.24.4.10:/mnt/exos",
              path: "/mnt/exos",
              fstype: "nfs4",
              state: "mounted",
            },
          },
        ],
        delete: [
          {
            module: "mount",
            args: {
              path: "/mnt/exos",
              state: "unmounted",
            },
          },
        ],
      },
    }, {
      deletedWith: this.vm,
      parent: this,
      dependsOn: [
        nfsCommon,
      ],
    });

    const volumesSetup = new mid.resource.AnsibleTaskList(`${id}-volumes-setup`, {
      connection: this.vm.connection,
      tasks: {
        create: [
          {
            module: "file",
            args: {
              path: "/mnt/exos/volumes/nekopara",
              state: "directory",
            },
          },
          {
            module: "file",
            args: {
              path: "/mnt/exos/volumes/nekopara/nfs",
              state: "directory",
            },
          },
          {
            module: "file",
            args: {
              path: "/mnt/exos/volumes/nekopara/etcd-snapshots",
              state: "directory",
            },
          },
        ],
      },
    }, {
      deletedWith: this.vm,
      parent: this,
      dependsOn: [
        exosMount,
      ],
    });

    const etcdSnapshotsMount = new mid.resource.AnsibleTaskList(`${id}-etcd-snapshots-mount`, {
      connection: this.vm.connection,
      tasks: {
        create: [
          {
            module: "mount",
            args: {
              path: "/var/lib/rancher/k3s/server/db/snapshots",
              src: "/mnt/exos/volumes/nekopara/etcd-snapshots",
              opts: "bind",
              state: "mounted",
              fstype: "none",
            },
          },
        ],
        delete: [
          {
            module: "mount",
            args: {
              path: "/var/lib/rancher/k3s/server/db/snapshots",
              state: "unmounted",
            },
          },
        ],
      },
    }, {
      deletedWith: this.vm,
      parent: this,
      dependsOn: [
        volumesSetup,
      ],
    });

    const nodeLabels: Record<string, pulumi.Input<string>> = props.labels ?? {};
    if (nodeLabels["topology.kubernetes.io/zone"] === undefined) {
      nodeLabels["topology.kubernetes.io/zone"] = this.vm.nodeName;
    }

    const nodeServerArgs: pulumi.Input<string>[] = [
      ...(props.serverArgs ?? []),
      "--disable-helm-controller",
      "--disable traefik",
      "--disable coredns",
      "--disable local-storage",
      "--disable metrics-server",
      "--write-kubeconfig-mode 644",
      "--etcd-snapshot-retention 100",
      "--etcd-snapshot-schedule-cron '0 * * * *'",
    ];

    nodeServerArgs.push("--tls-san", props.dnsFullName);
    nodeServerArgs.push("--tls-san", pulumi.interpolate`${this.vm.name}.sapslaj.xyz`);

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
      dependsOn: [
        etcdSnapshotsMount,
      ],
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
        new DNSRecordTrait("dns-record", {
          enableIPv6: false,
          lookupIPv6ViaSSH: false,
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

    const etcBell = new mid.resource.File(`${id}-/etc/bell`, {
      connection: this.vm.connection,
      config: {
        check: false,
      },
      path: "/etc/bell",
      ensure: "directory",
    }, {
      parent: this,
      deletedWith: this.vm,
      dependsOn: [
        midTarget,
      ],
    });

    const bellBinary = new mid.resource.File("/usr/local/bin/bell", {
      connection: this.vm.connection,
      config: {
        check: false,
      },
      path: "/usr/local/bin/bell",
      remoteSource: "https://git.sapslaj.cloud/sapslaj/bell/releases/download/v1.0.0/bell_Linux_x86_64",
      mode: "a+x",
    }, {
      parent: this,
      deletedWith: this.vm,
      dependsOn: [
        midTarget,
      ],
    });

    for (const [portName, port] of Object.entries(props.ports)) {
      const portConfig = new mid.resource.File(`${id}-/etc/bell/${portName}.cfg`, {
        connection: this.vm.connection,
        config: {
          check: false,
        },
        path: `/etc/bell/${portName}.cfg`,
        content: pulumi.concat(
          ...Object.values(props.controlPlaneNodes).map((node) => {
            return pulumi.interpolate`${node.vm.name}.sapslaj.xyz:${port}\n`;
          }),
        ),
      }, {
        parent: this,
        deletedWith: this.vm,
        dependsOn: [
          etcBell,
        ],
      });

      new SystemdUnit(`${id}-bell-${portName}.service`, {
        connection: this.vm.connection,
        config: {
          check: false,
        },
        triggers: {
          refresh: [
            portConfig.triggers.lastChanged,
            bellBinary.triggers.lastChanged,
          ],
        },
        name: `bell-${portName}.service`,
        ensure: "started",
        enabled: true,
        unit: {
          Description: "bell",
          After: "network-online.target",
        },
        service: {
          Type: "simple",
          Environment: pulumi.interpolate`NET_HOST=:${port}`,
          ExecStart: `/usr/local/bin/bell /etc/bell/${portName}.cfg`,
          Restart: "always",
          RestartSec: "1",
        },
        install: {
          WantedBy: "multi-user.target",
        },
      }, {
        parent: this,
        deletedWith: this.vm,
        dependsOn: [
          portConfig,
          bellBinary,
        ],
      });
    }
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
  serverUri: pulumi.interpolate`https://nekopara-c2-cbnyjq.sapslaj.xyz:6443`,
  serverArgs: [],
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
  dependsOn: [],
});

nodes["c2"] = new ControlPlaneNode("c2", {
  k3sToken,
  dnsHostName,
  dnsFullName,
  privateKey,
  k3sVersion: "v1.32.7+k3s1",
  distro: Distro.UBUNTU_24_04,
  serverUri: pulumi.interpolate`https://nekopara-c1-8symcg.sapslaj.xyz:6443`,
  serverArgs: [],
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
  // dependsOn: nodes["c1"].service,
});

nodes["c3"] = new ControlPlaneNode("c3", {
  k3sToken,
  dnsHostName,
  dnsFullName,
  privateKey,
  k3sVersion: "v1.32.7+k3s1",
  distro: Distro.UBUNTU_24_04,
  serverUri: pulumi.interpolate`https://nekopara-c1-8symcg.sapslaj.xyz:6443`,
  serverArgs: [],
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

for (let i = 1; i <= 1; i++) {
  nlbs[`nlba-${i}`] = new NLBNode(`nlba-${i}`, {
    dnsHostName,
    privateKey,
    distro: Distro.UBUNTU_24_04,
    controlPlaneNodes: nodes,
    ports: {
      k3s: 6443,
    },
  }, {
    dependsOn: Object.values(nlbs),
  });
}

// FIXME: managing this manually due to some weird shimiko issues
// new DNSRecord("server", {
//   name: dnsHostName,
//   type: "A",
//   records: Object.values(nlbs).map((node) => node.vm.ipv4),
// });

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
