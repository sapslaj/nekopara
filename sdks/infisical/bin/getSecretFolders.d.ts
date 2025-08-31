import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getSecretFolders(
  args: GetSecretFoldersArgs,
  opts?: pulumi.InvokeOptions,
): Promise<GetSecretFoldersResult>;
/**
 * A collection of arguments for invoking getSecretFolders.
 */
export interface GetSecretFoldersArgs {
  environmentSlug: string;
  folderPath: string;
  projectId: string;
}
/**
 * A collection of values returned by getSecretFolders.
 */
export interface GetSecretFoldersResult {
  readonly environmentSlug: string;
  readonly folderPath: string;
  readonly folders: outputs.GetSecretFoldersFolder[];
  /**
   * The provider-assigned unique ID for this managed resource.
   */
  readonly id: string;
  readonly projectId: string;
}
export declare function getSecretFoldersOutput(
  args: GetSecretFoldersOutputArgs,
  opts?: pulumi.InvokeOutputOptions,
): pulumi.Output<GetSecretFoldersResult>;
/**
 * A collection of arguments for invoking getSecretFolders.
 */
export interface GetSecretFoldersOutputArgs {
  environmentSlug: pulumi.Input<string>;
  folderPath: pulumi.Input<string>;
  projectId: pulumi.Input<string>;
}
