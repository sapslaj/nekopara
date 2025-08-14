import * as fs from "fs/promises";
import * as path from "path";

import { topologicalSort } from "graphology-dag";
import * as YAML from "yaml";

import { buildStackFromStackConfigs, getStackConfigs } from "./lib/stacks";

(async () => {
  const workflowPath = path.join(__dirname, "..", ".github", "workflows", "deploy.yaml");

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
          id: `deploy-${stack}`,
          run: `echo fake-deploying stack ${stack}...`,
        },
      ],
    };
  }

  await fs.writeFile(workflowPath, YAML.stringify(workflow));
})();
