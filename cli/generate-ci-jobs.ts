import * as fs from "fs/promises";
import * as path from "path";

import { topologicalSort } from "graphology-dag";
import * as YAML from "yaml";

import { buildStackFromStackConfigs, getStackConfigs } from "./lib/stacks";

(async () => {
  const workflowPath = path.join(__dirname, "..", ".gitea", "workflows", "deploy.yaml");

  let workflow = YAML.parse(
    await fs.readFile(workflowPath, { encoding: "utf8" }),
  );

  const stackConfigs = await getStackConfigs();
  const graph = await buildStackFromStackConfigs(stackConfigs);

  workflow.jobs = {};

  for (const stack of topologicalSort(graph)) {
    workflow.jobs[`deploy-${stack}`] = {
      "runs-on": "ubuntu-latest",
      "needs": stackConfigs[stack].dependencies.map((dep) => `deploy-${dep}`),
      "steps": [
        {
          uses: "actions/checkout@v4",
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
            "command": "preview",
            "stack-name": "prod",
            "cloud-url": "s3://sapslaj-tf-state?region=us-east-1&awssdk=v2&profile=pulumi-state",
            "work-dir": `./stacks/${stack}`,
          },
        },
      ],
    };
  }

  await fs.writeFile(workflowPath, YAML.stringify(workflow));
})();
