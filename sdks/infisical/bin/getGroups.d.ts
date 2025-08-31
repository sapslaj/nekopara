import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getGroups(opts?: pulumi.InvokeOptions): Promise<GetGroupsResult>;
/**
 * A collection of values returned by getGroups.
 */
export interface GetGroupsResult {
  readonly groups: outputs.GetGroupsGroup[];
  /**
   * The provider-assigned unique ID for this managed resource.
   */
  readonly id: string;
}
export declare function getGroupsOutput(opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetGroupsResult>;
