import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getIdentityDetails(opts?: pulumi.InvokeOptions): Promise<GetIdentityDetailsResult>;
/**
 * A collection of values returned by getIdentityDetails.
 */
export interface GetIdentityDetailsResult {
  /**
   * The provider-assigned unique ID for this managed resource.
   */
  readonly id: string;
  readonly organization: outputs.GetIdentityDetailsOrganization;
}
export declare function getIdentityDetailsOutput(
  opts?: pulumi.InvokeOutputOptions,
): pulumi.Output<GetIdentityDetailsResult>;
