import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getSecrets(args: GetSecretsArgs, opts?: pulumi.InvokeOptions): Promise<GetSecretsResult>;
/**
 * A collection of arguments for invoking getSecrets.
 */
export interface GetSecretsArgs {
  envSlug: string;
  folderPath: string;
  workspaceId?: string;
}
/**
 * A collection of values returned by getSecrets.
 */
export interface GetSecretsResult {
  readonly envSlug: string;
  readonly folderPath: string;
  /**
   * The provider-assigned unique ID for this managed resource.
   */
  readonly id: string;
  readonly secrets: {
    [key: string]: outputs.GetSecretsSecrets;
  };
  readonly workspaceId: string;
}
export declare function getSecretsOutput(
  args: GetSecretsOutputArgs,
  opts?: pulumi.InvokeOutputOptions,
): pulumi.Output<GetSecretsResult>;
/**
 * A collection of arguments for invoking getSecrets.
 */
export interface GetSecretsOutputArgs {
  envSlug: pulumi.Input<string>;
  folderPath: pulumi.Input<string>;
  workspaceId?: pulumi.Input<string>;
}
