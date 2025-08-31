import * as pulumi from "@pulumi/pulumi";
export declare function getSecretTag(args: GetSecretTagArgs, opts?: pulumi.InvokeOptions): Promise<GetSecretTagResult>;
/**
 * A collection of arguments for invoking getSecretTag.
 */
export interface GetSecretTagArgs {
  projectId: string;
  slug: string;
}
/**
 * A collection of values returned by getSecretTag.
 */
export interface GetSecretTagResult {
  readonly color: string;
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly slug: string;
}
export declare function getSecretTagOutput(
  args: GetSecretTagOutputArgs,
  opts?: pulumi.InvokeOutputOptions,
): pulumi.Output<GetSecretTagResult>;
/**
 * A collection of arguments for invoking getSecretTag.
 */
export interface GetSecretTagOutputArgs {
  projectId: pulumi.Input<string>;
  slug: pulumi.Input<string>;
}
