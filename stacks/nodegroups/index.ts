import * as tls from "@pulumi/tls";

import { NodeGroup } from "../../components/k3s-cluster/nodes";
import { getDnsFullName, getDnsHostName, getK3sToken, getServerUri, newK3sProvider } from "../../components/k3s-shared";
import { Distro } from "../../components/proxmox-vm/BaseConfigTrait";

const privateKey = new tls.PrivateKey("nodes", {
  algorithm: "ED25519",
  ecdsaCurve: "P256",
});

const provider = newK3sProvider();
const k3sToken = getK3sToken();
const dnsHostName = getDnsHostName();
const dnsFullName = getDnsFullName();
const serverUri = getServerUri();

// new NodeGroup("nga", {
//   k3sProvider: provider,
//   k3sVersion: "v1.32.7+k3s1",
//   k3sToken,
//   dnsHostName,
//   dnsFullName,
//   serverUri,
//   privateKey,
//   distro: Distro.UBUNTU_24_04,
//   nodeCount: 3,
//   vmConfig: {
//     cpu: {
//       type: "qemu64",
//       cores: 4,
//     },
//     memory: {
//       dedicated: 16 * 1024,
//     },
//   },
//   keepers: {
//     serial: "1",
//   },
// });

new NodeGroup("ngb", {
  k3sProvider: provider,
  k3sVersion: "v1.32.7+k3s1",
  k3sToken,
  dnsHostName,
  dnsFullName,
  serverUri,
  privateKey,
  distro: Distro.UBUNTU_24_04,
  nodeCount: 3,
  vmConfig: {
    cpu: {
      cores: 4,
    },
    memory: {
      dedicated: 16 * 1024,
    },
  },
  keepers: {
    serial: "1",
  },
});

// new NodeGroup("inga", {
//   k3sProvider: provider,
//   k3sVersion: "v1.32.7+k3s1",
//   k3sToken,
//   dnsHostName,
//   dnsFullName,
//   serverUri,
//   privateKey,
//   distro: Distro.UBUNTU_24_04,
//   nodeCount: 2,
//   vmConfig: {
//     cpu: {
//       type: "qemu64",
//       cores: 4,
//     },
//     memory: {
//       dedicated: 4 * 1024,
//     },
//   },
//   keepers: {
//     serial: "1",
//   },
//   labels: {
//     "k3s.sapslaj.xyz/role": "ingress",
//     "topology.kubernetes.io/region": "homelab",
//   },
//   taints: [
//     {
//       key: "k3s.sapslaj.xyz/role",
//       value: "ingress",
//       effect: "NoSchedule",
//     },
//   ],
// });

new NodeGroup("ingb", {
  k3sProvider: provider,
  k3sVersion: "v1.32.7+k3s1",
  k3sToken,
  dnsHostName,
  dnsFullName,
  serverUri,
  privateKey,
  distro: Distro.UBUNTU_24_04,
  nodeCount: 2,
  vmConfig: {
    cpu: {
      cores: 4,
    },
    memory: {
      dedicated: 4 * 1024,
    },
  },
  keepers: {
    serial: "1",
  },
  labels: {
    "k3s.sapslaj.xyz/role": "ingress",
    "topology.kubernetes.io/region": "homelab",
  },
  taints: [
    {
      key: "k3s.sapslaj.xyz/role",
      value: "ingress",
      effect: "NoSchedule",
    },
  ],
});

// new NodeGroup("lha", {
//   k3sProvider: provider,
//   k3sVersion: "v1.31.5+k3s1",
//   k3sToken,
//   dnsHostName,
//   dnsFullName,
//   serverUri,
//   privateKey,
//   distro: Distro.UBUNTU_24_04,
//   nodeCount: 3,
//   vmConfig: {
//     cpu: {
//       cores: 4,
//     },
//     memory: {
//       dedicated: 4 * 1024,
//     },
//   },
//   diskConfig: {
//     size: 128,
//   },
//   keepers: {
//     serial: "1",
//   },
//   annotations: {
//     "node.longhorn.io/default-node-tags": JSON.stringify(["storage"]),
//   },
//   labels: {
//     "k3s.sapslaj.xyz/role": "longhorn",
//     "topology.kubernetes.io/region": "homelab",
//     "node.longhorn.io/create-default-disk": "true",
//   },
//   taints: [
//     {
//       key: "k3s.sapslaj.xyz/role",
//       value: "longhorn",
//       effect: "NoSchedule",
//     },
//   ],
// });

// new NodeGroup("lhb", {
//   k3sProvider: provider,
//   k3sVersion: "v1.31.5+k3s1",
//   k3sToken,
//   dnsHostName,
//   dnsFullName,
//   serverUri,
//   privateKey,
//   distro: Distro.UBUNTU_24_04,
//   nodeCount: 3,
//   vmConfig: {
//     cpu: {
//       cores: 4,
//     },
//     memory: {
//       dedicated: 4 * 1024,
//     },
//   },
//   diskConfig: {
//     size: 128,
//   },
//   keepers: {
//     serial: "1",
//   },
//   labels: {
//     "k3s.sapslaj.xyz/role": "longhorn",
//     "topology.kubernetes.io/region": "homelab",
//     "node.longhorn.io/create-default-disk": "true",
//   },
//   taints: [
//     {
//       key: "k3s.sapslaj.xyz/role",
//       value: "longhorn",
//       effect: "NoSchedule",
//     },
//   ],
// });
