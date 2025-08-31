import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getProjects(args: GetProjectsArgs, opts?: pulumi.InvokeOptions): Promise<GetProjectsResult>;
/**
 * A collection of arguments for invoking getProjects.
 */
export interface GetProjectsArgs {
  slug: string;
}
/**
 * A collection of values returned by getProjects.
 */
export interface GetProjectsResult {
  readonly autoCapitalization: boolean;
  readonly createdAt: string;
  readonly environments: {
    [key: string]: outputs.GetProjectsEnvironments;
  };
  readonly id: string;
  readonly name: string;
  readonly orgId: string;
  readonly slug: string;
  readonly updatedAt: string;
  readonly upgradeStatus: string;
  readonly version: number;
}
export declare function getProjectsOutput(
  args: GetProjectsOutputArgs,
  opts?: pulumi.InvokeOutputOptions,
): pulumi.Output<GetProjectsResult>;
/**
 * A collection of arguments for invoking getProjects.
 */
export interface GetProjectsOutputArgs {
  slug: pulumi.Input<string>;
}
