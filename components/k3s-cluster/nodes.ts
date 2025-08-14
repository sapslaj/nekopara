import * as k8s from "@kubernetes/client-node";
import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as tls from "@pulumi/tls";
import * as mid from "@sapslaj/pulumi-mid";

import { IDistro } from "../../components/homelab-config";
import { getKubeconfig } from "../../components/k3s-shared";
import { BaselineUsers } from "../../components/mid/BaselineUsers";
import { MidTarget } from "../../components/mid/MidTarget";
import { CloudImageTrait } from "../../components/proxmox-vm/CloudImageTrait";
import { PrivateKeyTrait } from "../../components/proxmox-vm/PrivateKeyTrait";
import { ProxmoxVM, ProxmoxVMDiskConfig, ProxmoxVMProps } from "../../components/proxmox-vm/ProxmoxVM";

export interface NodeConfigProviderConfig {
  kubeconfig: string;
  timeoutSeconds?: number;
}

export interface NodeConfigProviderTaint {
  effect: string;
  key: string;
  value: string;
}

export interface NodeConfigProviderInputs extends NodeConfigProviderConfig {
  name: string;
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
  taints?: NodeConfigProviderTaint[];
  unschedulable?: boolean;
  drain?: boolean;
}

export interface NodeConfigProviderOutputs extends NodeConfigProviderInputs {}

export class NodeConfigProvider
  implements pulumi.dynamic.ResourceProvider<NodeConfigProviderInputs, NodeConfigProviderOutputs>
{
  constructor() {}

  makeKubeConfig(config: NodeConfigProviderConfig): k8s.KubeConfig {
    const kc = new k8s.KubeConfig();
    kc.loadFromString(config.kubeconfig);
    return kc;
  }

  async create(inputs: NodeConfigProviderInputs): Promise<pulumi.dynamic.CreateResult<NodeConfigProviderOutputs>> {
    if (inputs.drain) {
      inputs.unschedulable = true;
    }
    this.update(inputs.name, inputs, inputs);
    return {
      id: inputs.name,
      outs: inputs,
    };
  }

  async update(
    id: pulumi.ID,
    olds: NodeConfigProviderOutputs,
    inputs: NodeConfigProviderInputs,
  ): Promise<pulumi.dynamic.UpdateResult<NodeConfigProviderOutputs>> {
    if (inputs.drain) {
      inputs.unschedulable = true;
    }
    const kc = this.makeKubeConfig(inputs);
    const api = kc.makeApiClient(k8s.CoreV1Api);
    let err: k8s.ApiException<string | Buffer | undefined> | undefined = undefined;
    let end = Date.now() + ((inputs.timeoutSeconds ?? 60) * 1000);
    while (Date.now() < end) {
      try {
        const node = await api.readNode({
          name: inputs.name,
        });

        const annotations = {
          ...node.metadata!.annotations,
        };
        for (const key of Object.keys(olds.annotations ?? {})) {
          delete annotations[key];
        }
        for (const key of Object.keys(inputs.annotations ?? {})) {
          annotations[key] = (inputs.annotations ?? {})[key];
        }

        const labels = {
          ...node.metadata!.labels,
        };
        for (const key of Object.keys(olds.labels ?? {})) {
          delete labels[key];
        }
        for (const key of Object.keys(inputs.labels ?? {})) {
          labels[key] = (inputs.labels ?? {})[key];
        }

        await api.patchNode(
          {
            name: node.metadata!.name!,
            body: [
              {
                op: "replace",
                path: "/metadata/annotations",
                value: annotations,
              },
              {
                op: "replace",
                path: "/metadata/labels",
                value: labels,
              },
              {
                op: "replace",
                path: "/spec/taints",
                value: inputs.taints ?? [],
              },
              {
                op: "replace",
                path: "/spec/unschedulable",
                value: inputs.unschedulable ?? false,
              },
            ],
          },
          k8s.setHeaderOptions("Content-Type", k8s.PatchStrategy.JsonPatch),
        );
        break;
      } catch (error) {
        if (error instanceof k8s.ApiException) {
          err = error;
        } else {
          throw error;
        }
      }
    }
    if (err) {
      throw err;
    }
    if (inputs.drain) {
      this.drain(inputs);
    }
    return {
      outs: inputs,
    };
  }

  async delete(id: pulumi.ID, props: NodeConfigProviderOutputs): Promise<void> {
    props.unschedulable = true;
    props.drain = true;
    this.update(id, props, props);
    const kc = this.makeKubeConfig(props);
    const api = kc.makeApiClient(k8s.CoreV1Api);
    try {
      await api.deleteNode({
        name: props.name,
      });
    } catch (error) {
      if (!(error instanceof k8s.ApiException)) {
        throw error;
      }
    }
  }

  async drain(inputs: NodeConfigProviderInputs): Promise<void> {
    const kc = this.makeKubeConfig(inputs);
    const api = kc.makeApiClient(k8s.CoreV1Api);
    let err: k8s.ApiException<string | Buffer | undefined> | undefined = undefined;
    let end = Date.now() + ((inputs.timeoutSeconds ?? 60) * 1000);
    end = Date.now() + ((inputs.timeoutSeconds ?? 60) * 1000);
    while (Date.now() < end) {
      try {
        const podsResponse = await api.listPodForAllNamespaces({
          fieldSelector: `spec.nodeName=${inputs.name}`,
        });

        const podsToEvict = podsResponse.items.filter(pod => {
          if (pod.metadata?.deletionTimestamp) {
            return false;
          }
          if (pod.metadata?.ownerReferences?.some(ref => ref.kind === "DaemonSet")) {
            return false;
          }
          if (pod.metadata?.annotations?.["kubernetes.io/config.source"] === "api") {
            return false;
          }
          if (pod.status?.phase === "Succeeded" || pod.status?.phase === "Failed") {
            return false;
          }
          return true;
        });

        const evictionPromises = podsToEvict.map(async (pod) => {
          try {
            await api.createNamespacedPodEviction({
              name: pod.metadata!.name!,
              namespace: pod.metadata!.namespace!,
              body: {
                apiVersion: "policy/v1",
                kind: "Eviction",
                metadata: {
                  name: pod.metadata!.name!,
                  namespace: pod.metadata!.namespace!,
                },
              },
            });
          } catch (evictError) {
            if (
              evictError instanceof k8s.ApiException
              && (evictError.code === 404 || evictError.code === 429)
            ) {
              return;
            }
            throw evictError;
          }
        });

        await Promise.all(evictionPromises);

        const evictionEnd = Date.now() + ((inputs.timeoutSeconds ?? 60) * 1000);
        while (Date.now() < evictionEnd) {
          const remainingPodsResponse = await api.listPodForAllNamespaces({
            fieldSelector: `spec.nodeName=${inputs.name}`,
          });

          const remainingPods = remainingPodsResponse.items.filter(pod => {
            if (pod.metadata?.deletionTimestamp) {
              return false;
            }
            if (pod.metadata?.ownerReferences?.some(ref => ref.kind === "DaemonSet")) {
              return false;
            }
            if (pod.metadata?.annotations?.["kubernetes.io/config.source"] === "api") {
              return false;
            }
            if (pod.status?.phase === "Succeeded" || pod.status?.phase === "Failed") {
              return false;
            }
            return true;
          });

          if (remainingPods.length === 0) {
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        break;
      } catch (error) {
        if (error instanceof k8s.ApiException) {
          err = error;
        } else {
          throw error;
        }
      }
    }
    if (err) {
      throw err;
    }
  }
}

export interface NodeConfigTaint {
  effect: pulumi.Input<string>;
  key: pulumi.Input<string>;
  value: pulumi.Input<string>;
}

export interface NodeConfigInputs {
  kubeconfig: pulumi.Input<string>;
  timeoutSeconds?: pulumi.Input<number>;
  name: pulumi.Input<string>;
  annotations?: pulumi.Input<Record<string, pulumi.Input<string>>>;
  labels?: pulumi.Input<Record<string, pulumi.Input<string>>>;
  taints?: pulumi.Input<pulumi.Input<NodeConfigTaint>[]>;
  unschedulable?: pulumi.Input<boolean>;
  drain?: pulumi.Input<boolean>;
}

export class NodeConfig extends pulumi.dynamic.Resource {
  public readonly name!: pulumi.Output<string>;

  constructor(name: string, props: NodeConfigInputs, opts?: pulumi.CustomResourceOptions) {
    const provider = opts?.provider as any as NodeConfigProvider ?? new NodeConfigProvider();
    super(provider, name, props, opts);
  }
}

export interface NodeProps {
  k3sProvider: kubernetes.Provider;
  k3sVersion: pulumi.Input<string>;
  k3sToken: pulumi.Input<string>;
  dnsHostName: pulumi.Input<string>;
  dnsFullName: pulumi.Input<string>;
  serverUri: pulumi.Input<string>;
  privateKey: tls.PrivateKey;
  distro: IDistro;
  annotations?: pulumi.Input<Record<string, pulumi.Input<string>>>;
  labels?: pulumi.Input<Record<string, pulumi.Input<string>>>;
  taints?: pulumi.Input<pulumi.Input<NodeConfigTaint>[]>;
  unschedulable?: pulumi.Input<boolean>;
  drain?: pulumi.Input<boolean>;
  vmConfig?: ProxmoxVMProps;
  diskConfig?: Partial<ProxmoxVMDiskConfig>;
  serverArgs?: pulumi.Input<string>[];
  keepers?: Record<string, pulumi.Input<string>>;
}

export class Node extends pulumi.ComponentResource {
  vm: ProxmoxVM;
  randomId: random.RandomId;
  service: mid.resource.SystemdService;

  constructor(id: string, props: NodeProps, opts: pulumi.ComponentResourceOptions = {}) {
    super("sapslaj:k3s:Node", id, {}, opts);

    this.randomId = new random.RandomId(id, {
      byteLength: 4,
      keepers: {
        k3sVersion: props.k3sVersion,
        ...props.keepers,
      },
    }, {
      parent: this,
    });

    const vmConfig = props.vmConfig ?? {};

    this.vm = new ProxmoxVM(id, {
      name: pulumi.all({ randomIdResult: this.randomId.id, dnsHostName: props.dnsHostName }).apply(
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
            url: props.distro.url,
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
        ...(vmConfig.traits ?? []),
      ],
      connectionArgs: {
        user: props.distro.username,
        ...vmConfig.connectionArgs,
      },
      cpu: {
        cores: 4,
        ...vmConfig.cpu,
      },
      memory: {
        dedicated: 4096,
        ...vmConfig.memory,
      },
      ...vmConfig,
    }, {
      parent: this,
    });

    const nodeServerArgs: pulumi.Input<string>[] = [
      ...(props.serverArgs ?? []),
    ];

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

    nodeServerArgs.push("--node-label", "topology.kubernetes.io/region=homelab");
    nodeServerArgs.push("--node-label", pulumi.interpolate`topology.kubernetes.io/zone=${this.vm.nodeName}`);
    nodeServerArgs.push("--node-taint", "k3s.sapslaj.xyz/provisioning=true:NoSchedule");
    nodeServerArgs.push("--server", props.serverUri);

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

    const k3sAgentServiceEnv = new mid.resource.File(`${id}-k3s-agent-service-env`, {
      connection: this.vm.connection,
      path: "/etc/systemd/system/k3s-agent.service.env",
      content: pulumi.concat(
        pulumi.interpolate`K3S_TOKEN='${props.k3sToken}'\n`,
        pulumi.interpolate`K3S_URL='${props.serverUri}'\n`,
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

    const k3sAgentServiceUnit = new mid.resource.File(`${id}-k3s-agent-service-unit`, {
      connection: this.vm.connection,
      path: "/etc/systemd/system/k3s-agent.service",
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
        pulumi.interpolate`EnvironmentFile=${k3sAgentServiceEnv.path}\n`,
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
        pulumi.interpolate`ExecStart=/usr/local/bin/k3s agent `,
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

    this.service = new mid.resource.SystemdService(`${id}-k3s-agent`, {
      connection: this.vm.connection,
      name: "k3s-agent.service",
      ensure: "started",
      enabled: true,
      daemonReload: true,
      triggers: {
        refresh: [
          sysctlReload.triggers.lastChanged,
          k3sBinary.triggers.lastChanged,
          k3sAgentServiceEnv.triggers.lastChanged,
          k3sAgentServiceUnit.triggers.lastChanged,
        ],
        replace: [
          this.randomId.id,
        ],
      },
    }, {
      parent: this,
      retainOnDelete: true,
      dependsOn: [
        // nfsSetup,
      ],
    });

    new NodeConfig(id, {
      name: this.vm.name,
      kubeconfig: getKubeconfig(),
      annotations: props.annotations,
      labels: props.labels,
      taints: props.taints,
      unschedulable: props.unschedulable,
      drain: props.drain,
    }, {
      parent: this,
      dependsOn: [
        this.service,
      ],
    });
  }
}

export interface NodeGroupProps extends NodeProps {
  nodeCount: number;
}

export class NodeGroup extends pulumi.ComponentResource {
  nodes: Node[];

  constructor(id: string, props: NodeGroupProps, opts: pulumi.ComponentResourceOptions = {}) {
    super("sapslaj:k3s:NodeGroup", id, {}, opts);

    this.nodes = [];

    for (let i = 1; i <= props.nodeCount; i++) {
      this.nodes.push(
        new Node(
          `${id}-${i}`,
          props,
          pulumi.mergeOptions(opts, {
            parent: this,
          }),
        ),
      );
    }
  }
}
