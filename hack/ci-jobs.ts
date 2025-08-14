import * as fs from "fs/promises";
import * as path from "path";

import { DirectedGraph } from "graphology";
import { topologicalSort } from "graphology-dag";

interface StackConfig {
  skip?: boolean;
  dependencies: string[];
}

(async () => {
  const entries = await fs.readdir(path.join(__dirname, "..", "stacks"), {
    withFileTypes: true,
  });
  const stackConfigs: Record<string, StackConfig> = {};
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    stackConfigs[entry.name] = JSON.parse(
      await fs.readFile(path.join(__dirname, "..", "stacks", entry.name, "ci.json"), { encoding: "utf8" }),
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

  const jobs: any[] = [
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
  ];

  for (const stack of topologicalSort(graph)) {
    jobs.push({
      id: `deploy-${stack}`,
      run: `echo fake-deploying stack ${stack}...`,
    });
  }

  console.log(`::set-output jobs=${JSON.stringify(jobs)}`);
})();
