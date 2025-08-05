#!/usr/bin/env python3
import argparse
import os
import textwrap


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    args = parser.parse_args()

    os.mkdir(os.path.join("stacks", args.name))
    with open(f"stacks/{args.name}/Pulumi.yaml", "w") as f:
        f.write(
            textwrap.dedent(
                f"""
                name: nekopara.{args.name}
                runtime:
                  name: nodejs
                  options:
                    packagemanager: npm
                """,
            ).lstrip()
        )

    with open(f"stacks/{args.name}/index.ts", "w") as f:
        f.write(
            textwrap.dedent(
                """
                    import * as kubernetes from "@pulumi/kubernetes";
                    import * as pulumi from "@pulumi/pulumi";

                    import { getDnsFullName, getDnsHostName, newK3sProvider } from "../../components/k3s-shared";
                    import { DNSRecord } from "../../components/shimiko/DNSRecord";

                    const provider = newK3sProvider();
                    const dnsFullName = getDnsFullName();
                    const dnsHostName = getDnsHostName();

                    const namespace = new kubernetes.core.v1.Namespace("{name}", {
                      metadata: {
                        name: "{name}",
                      },
                    }, { provider });

                    const chart = new kubernetes.helm.v3.Chart("{name}", {
                      chart: "{name}",
                      fetchOpts: {
                        repo: "https://example.com/helm-charts",
                      },
                      version: "TODO",
                      namespace: namespace.metadata.name,
                      skipCRDRendering: true,
                      values: {
                      },
                    }, {
                      provider,
                    });

                    const dns = new DNSRecord("{name}", {
                      name: pulumi.interpolate`{name}.${dnsHostName}`,
                      records: [dnsFullName],
                      type: "CNAME",
                    });
                """.replace("{name}", args.name),
            ).lstrip()
        )


if __name__ == "__main__":
    main()
