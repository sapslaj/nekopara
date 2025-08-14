import * as fs from "fs/promises";
import * as path from "path";

import { DirectedGraph } from "graphology";

export interface StackConfig {
  skip?: boolean;
  dependencies: string[];
}

export const stacksDir = path.join(__dirname, "..", "..", "stacks");

export async function getStackConfigs(): Promise<Record<string, StackConfig>> {
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
  return stackConfigs;
}

export async function buildStackFromStackConfigs(stackConfigs: Record<string, StackConfig>): Promise<DirectedGraph> {
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
  return graph;
}
