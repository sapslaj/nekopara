#!/usr/bin/env python3
import argparse
import os
import subprocess
import sys
import yaml



def merge_list(l, append, name):
    return [c for c in l if c["name"] != name] + [append]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--kube-config", default="~/.kube/config", help="Path to existing kubeconfig"
    )
    parser.add_argument(
        "--name", help="Set name of context/server/user instead of using dnsHostName"
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Output result to stdout instead of writing a new kubeconfig",
    )
    args = parser.parse_args()

    content = subprocess.check_output(
        args=[
            "pulumi",
            "stack",
            "output",
            "--show-secrets",
            "kubeconfig",
        ],
        encoding="utf-8",
    )

    name = None
    if args.name:
        name = args.name
    else:
        name = subprocess.check_output(
            args=[
                "pulumi",
                "stack",
                "output",
                "--show-secrets",
                "dnsHostName",
            ],
            encoding="utf-8",
        ).strip()

    new_kubeconfig = None
    new_kubeconfig = yaml.safe_load(content)

    new_kubeconfig["users"][0]["name"] = name
    new_kubeconfig["clusters"][0]["name"] = name
    new_kubeconfig["contexts"][0]["name"] = name
    new_kubeconfig["contexts"][0]["context"]["cluster"] = new_kubeconfig["clusters"][0][
        "name"
    ]
    new_kubeconfig["contexts"][0]["context"]["user"] = new_kubeconfig["users"][0][
        "name"
    ]

    if os.path.exists(os.path.expanduser(args.kube_config)):
        with open(os.path.expanduser(args.kube_config), "r") as f:
            kubeconfig = yaml.safe_load(f)
    else:
        kubeconfig = {
            "apiVersion": "v1",
            "kind": "Config",
            "preferences": {},
            "clusters": [],
            "contexts": [],
            "users": [],
        }
    kubeconfig["clusters"] = merge_list(
        kubeconfig.get("clusters", []), new_kubeconfig["clusters"][0], name
    )
    kubeconfig["contexts"] = merge_list(
        kubeconfig.get("contexts", []), new_kubeconfig["contexts"][0], name
    )
    kubeconfig["users"] = merge_list(
        kubeconfig.get("users", []), new_kubeconfig["users"][0], name
    )
    if "current-context" not in kubeconfig:
        kubeconfig["current-context"] = name
    if args.stdout:
        yaml.safe_dump(kubeconfig, sys.stdout)
    else:
        if not os.path.exists(os.path.dirname(os.path.expanduser(args.kube_config))):
            os.mkdir(os.path.dirname(os.path.expanduser(args.kube_config)))
        with open(os.path.expanduser(args.kube_config), "w") as f:
            yaml.safe_dump(kubeconfig, f)


if __name__ == "__main__":
    main()
