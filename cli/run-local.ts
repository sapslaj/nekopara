import { spawn } from "child_process";
import * as path from "path";

import { topologicalGenerations } from "graphology-dag/topological-sort";

import { buildStackFromStackConfigs, getStackConfigs, stacksDir } from "./lib/stacks";

function runCommand(stack: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = spawn("pulumi", [
      "up",
      "--yes",
      "--skip-preview",
      "--color",
      "auto",
      "--stack",
      "prod",
      "--non-interactive",
    ], {
      cwd: path.join(stacksDir, stack),
      stdio: ["inherit", "inherit", "inherit"],
    });

    cmd.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed for stack ${stack} with exit code ${code}`));
      }
    });

    cmd.on("error", (error) => {
      reject(new Error(`Failed to start command for stack ${stack}: ${error.message}`));
    });
  });
}

(async () => {
  const stackConfigs = await getStackConfigs();
  const graph = await buildStackFromStackConfigs(stackConfigs);

  for (const generation of topologicalGenerations(graph)) {
    const promises = generation.map(stack => runCommand(stack));
    await Promise.all(promises);
  }
})();
