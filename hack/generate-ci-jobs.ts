import * as fs from "fs/promises";
import * as path from "path";

import { DirectedGraph } from "graphology";
import { topologicalSort } from "graphology-dag";
import * as YAML from "yaml";

interface StackConfig {
  skip?: boolean;
  dependencies: string[];
}

(async () => {
  const stacksDir = path.join(__dirname, "..", "stacks");
  const workflowPath = path.join(__dirname, "..", ".github", "workflows", "deploy.yaml");

  let workflow = YAML.parse(
    await fs.readFile(workflowPath, { encoding: "utf8" }),
  );

  const entries = await fs.readdir(stacksDir, {
    withFileTypes: true,
  });
  const stackConfigs: Record<string, StackConfig> = {};
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    stackConfigs[entry.name] = JSON.parse(
      await fs.readFile(path.join(stacksDir, entry.name, "ci.json"), { encoding: "utf8" }),
    );
  }
  const graph = new DirectedGraph();
  for (const [key, config] of Object.entries(stackConfigs)) {
    if (config.skip) {
      continue;
    }
    for (const dep of config.dependencies) {
      if (!(dep in stackConfigs)) {
        throw new Error(`'${dep}' does not exist; declared a dependency of stack '${key}'.`);
      }
      graph.mergeEdge(dep, key);
    }
  }

  workflow.jobs = {};

  for (const stack of topologicalSort(graph)) {
    workflow.jobs[`deploy-${stack}`] = {
      "runs-on": "ubuntu-latest",
      "needs": stackConfigs[stack].dependencies,
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
