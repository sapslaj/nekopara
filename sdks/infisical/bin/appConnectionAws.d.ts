import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class AppConnectionAws extends pulumi.CustomResource {
  /**
   * Get an existing AppConnectionAws resource's state with the given name, ID, and optional extra
   * properties used to qualify the lookup.
   *
   * @param name The _unique_ name of the resulting resource.
   * @param id The _unique_ provider ID of the resource to lookup.
   * @param state Any extra arguments used during the lookup.
   * @param opts Optional settings to control the behavior of the CustomResource.
   */
  static get(
    name: string,
    id: pulumi.Input<pulumi.ID>,
    state?: AppConnectionAwsState,
    opts?: pulumi.CustomResourceOptions,
  ): AppConnectionAws;
  /**
   * Returns true if the given object is an instance of AppConnectionAws.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is AppConnectionAws;
  /**
   * The credentials for the AWS App Connection
   */
  readonly credentials: pulumi.Output<outputs.AppConnectionAwsCredentials>;
  /**
   * The hash of the AWS App Connection credentials
   */
  readonly credentialsHash: pulumi.Output<string>;
  /**
   * An optional description for the AWS App Connection.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The method used to authenticate with AWS. Possible values are: assume-role, access-key
   */
  readonly method: pulumi.Output<string>;
  /**
   * The name of the AWS App Connection to create. Must be slug-friendly
   */
  readonly name: pulumi.Output<string>;
  /**
   * Create a AppConnectionAws resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: AppConnectionAwsArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering AppConnectionAws resources.
 */
export interface AppConnectionAwsState {
  /**
   * The credentials for the AWS App Connection
   */
  credentials?: pulumi.Input<inputs.AppConnectionAwsCredentials>;
  /**
   * The hash of the AWS App Connection credentials
   */
  credentialsHash?: pulumi.Input<string>;
  /**
   * An optional description for the AWS App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with AWS. Possible values are: assume-role, access-key
   */
  method?: pulumi.Input<string>;
  /**
   * The name of the AWS App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a AppConnectionAws resource.
 */
export interface AppConnectionAwsArgs {
  /**
   * The credentials for the AWS App Connection
   */
  credentials: pulumi.Input<inputs.AppConnectionAwsCredentials>;
  /**
   * An optional description for the AWS App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with AWS. Possible values are: assume-role, access-key
   */
  method: pulumi.Input<string>;
  /**
   * The name of the AWS App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
