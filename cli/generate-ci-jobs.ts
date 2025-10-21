import * as fs from "fs/promises";
import * as path from "path";

import { topologicalSort } from "graphology-dag";
import * as YAML from "yaml";

import { buildStackFromStackConfigs, getStackConfigs } from "./lib/stacks";

const env = {
  AUTHENTIK_INSECURE: "false",
  AUTHENTIK_TOKEN: "${{ secrets.AUTHENTIK_TOKEN }}",
  AUTHENTIK_URL: "https://login.sapslaj.cloud",
  AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
  AWS_DEFAULT_REGION: "us-east-1",
  AWS_REGION: "us-east-1",
  AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
  CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
  CLOUDFLARE_API_KEY: "${{ secrets.CLOUDFLARE_API_KEY }}",
  CLOUDFLARE_EMAIL: "${{ secrets.CLOUDFLARE_EMAIL }}",
  GH_ACTIONS_READ_TOKEN: "${{ secrets.GH_ACTIONS_READ_TOKEN }}",
  INFISICAL_API_URL: "https://infisical.sapslaj.cloud/api",
  INFISICAL_CLIENT_ID: "${{ secrets.INFISICAL_CLIENT_ID }}",
  INFISICAL_CLIENT_SECRET: "${{ secrets.INFISICAL_CLIENT_SECRET }}",
  INFISICAL_HOST: "https://infisical.sapslaj.cloud",
  INFISICAL_UNIVERSAL_AUTH_CLIENT_ID: "${{ secrets.INFISICAL_CLIENT_ID }}",
  INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET: "${{ secrets.INFISICAL_CLIENT_SECRET }}",
  NODE_AUTH_TOKEN: "${{ secrets.GH_ACTIONS_READ_TOKEN }}",
  PROXMOX_VE_ENDPOINT: "${{ secrets.PROXMOX_VE_ENDPOINT }}",
  PROXMOX_VE_INSECURE: "true",
  PROXMOX_VE_PASSWORD: "${{ secrets.PROXMOX_VE_PASSWORD }}",
  PROXMOX_VE_USERNAME: "${{ secrets.PROXMOX_VE_USERNAME }}",
  PULUMI_CONFIG_PASSPHRASE: "",
  TAILSCALE_API_KEY: "${{ secrets.TAILSCALE_API_KEY }}",
  VULTR_API_KEY: "${{ secrets.VULTR_API_KEY }}",
  VYOS_HOST: "${{ secrets.VYOS_HOST }}",
  VYOS_PASSWORD: "${{ secrets.VYOS_PASSWORD }}",
  VYOS_USERNAME: "${{ secrets.VYOS_USERNAME }}",
};

(async () => {
  const stackConfigs = await getStackConfigs();
  const graph = await buildStackFromStackConfigs(stackConfigs);

  const workflowsPath = path.join(__dirname, "..", ".gitea", "workflows");

  await fs.rm(workflowsPath, {
    recursive: true,
    force: true,
  });
  await fs.mkdir(workflowsPath);

  const jobs = {};

  for (const stack of topologicalSort(graph)) {
    await fs.writeFile(
      path.join(workflowsPath, `deploy-stack-${stack}.yaml`),
      YAML.stringify({
        name: `deploy-stack-${stack}.yaml`,
        on: {
          push: {
            paths: [
              `stacks/${stack}`,
            ],
          },
          workflow_call: null,
          workflow_dispatch: null,
        },
        env,
        jobs: {
          deploy: {
            "runs-on": "ubuntu-latest",
            "steps": [
              {
                uses: "actions/checkout@v5",
              },
              {
                uses: "actions/setup-node@v4",
                with: {
                  "node-version": "22.x",
                  "cache": "npm",
                  "cache-dependency-path": "package-lock.json",
                  "registry-url": "https://npm.pkg.github.com",
                },
              },
              {
                run: "npm ci --ignore-scripts",
              },
              {
                name: "Create pulumi-state AWS profile",
                shell: "bash",
                run: `mkdir -p ~/.aws
cat >> ~/.aws/credentials << EOF
[pulumi-state]
aws_access_key_id=\${{ secrets.AWS_ACCESS_KEY_ID }}
aws_secret_access_key=\${{ secrets.AWS_SECRET_ACCESS_KEY }}
EOF
cat >> ~/.aws/config << EOF
[profile pulumi-state]
region=us-east-1
output=json
EOF
`,
              },
              {
                uses: "pulumi/actions@v6",
                with: {
                  "command": "${{ github.ref_name == 'main' && 'up' || 'preview' }}",
                  "stack-name": "prod",
                  "cloud-url": "s3://sapslaj-tf-state?region=us-east-1&awssdk=v2&profile=pulumi-state",
                  "work-dir": `./stacks/${stack}`,
                },
              },
            ],
          },
        },
      }),
    );

    jobs[`deploy-stack-${stack}`] = {
      uses: `./.gitea/workflows/deploy-stack-${stack}.yaml`,
      needs: stackConfigs[stack].dependencies.map((dep) => `deploy-stack-${dep}`),
      secrets: "inherit",
    };
  }

  await fs.writeFile(
    path.join(workflowsPath, "deploy-all.yaml"),
    YAML.stringify({
      name: "deploy-all",
      on: {
        push: {
          paths: [
            ".gitea/workflows/**",
            "components/**",
            "package.json",
            "package-lock.json",
          ],
        },
        workflow_dispatch: null,
      },
      env,
      jobs,
    }),
  );
})();
