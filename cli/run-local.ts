import { spawn } from "child_process";
import * as path from "path";

import { topologicalGenerations } from "graphology-dag/topological-sort";
import { termost } from "termost";

import { buildStackFromStackConfigs, getStackConfigs, stacksDir } from "./lib/stacks";

function runPulumiCommand(stack: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = spawn("pulumi", args, {
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

const program = termost<{}>({
  name: "nekopara-cli",
  description: "",
  version: "",
});

program
  .command<{
    refresh: boolean;
  }>({
    name: "up",
    description: "",
  })
  .option({
    key: "refresh",
    description: "",
    name: "refresh",
    defaultValue: false,
  })
  .task({
    handler: async (context) => {
      const stackConfigs = await getStackConfigs();
      const graph = await buildStackFromStackConfigs(stackConfigs);

      const args = [
        "up",
        "--yes",
        "--skip-preview",
        "--color",
        "auto",
        "--stack",
        "prod",
        "--non-interactive",
      ];

      if (context.refresh) {
        args.push("--refresh");
      }

      for (const generation of topologicalGenerations(graph)) {
        const promises = generation.map(stack => runPulumiCommand(stack, args));
        await Promise.all(promises);
      }
    },
  });

program
  .command<{
    refresh: boolean;
  }>({
    name: "preview",
    description: "",
  })
  .option({
    key: "refresh",
    description: "",
    name: "refresh",
    defaultValue: false,
  })
  .task({
    handler: async (context) => {
      const stackConfigs = await getStackConfigs();
      const graph = await buildStackFromStackConfigs(stackConfigs);

      const args = [
        "preview",
        "--color",
        "auto",
        "--stack",
        "prod",
        "--non-interactive",
      ];

      if (context.refresh) {
        args.push("--refresh");
      }

      for (const generation of topologicalGenerations(graph)) {
        const promises = generation.map(stack => runPulumiCommand(stack, args));
        await Promise.all(promises);
      }
    },
  });
