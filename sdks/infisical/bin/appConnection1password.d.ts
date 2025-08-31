import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class AppConnection1password extends pulumi.CustomResource {
  /**
   * Get an existing AppConnection1password resource's state with the given name, ID, and optional extra
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
    state?: AppConnection1passwordState,
    opts?: pulumi.CustomResourceOptions,
  ): AppConnection1password;
  /**
   * Returns true if the given object is an instance of AppConnection1password.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is AppConnection1password;
  /**
   * The credentials for the 1Password App Connection
   */
  readonly credentials: pulumi.Output<outputs.AppConnection1passwordCredentials>;
  /**
   * The hash of the 1Password App Connection credentials
   */
  readonly credentialsHash: pulumi.Output<string>;
  /**
   * An optional description for the 1Password App Connection.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The method used to authenticate with 1Password. Possible values are: api-token
   */
  readonly method: pulumi.Output<string>;
  /**
   * The name of the 1Password App Connection to create. Must be slug-friendly
   */
  readonly name: pulumi.Output<string>;
  /**
   * Create a AppConnection1password resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: AppConnection1passwordArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering AppConnection1password resources.
 */
export interface AppConnection1passwordState {
  /**
   * The credentials for the 1Password App Connection
   */
  credentials?: pulumi.Input<inputs.AppConnection1passwordCredentials>;
  /**
   * The hash of the 1Password App Connection credentials
   */
  credentialsHash?: pulumi.Input<string>;
  /**
   * An optional description for the 1Password App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with 1Password. Possible values are: api-token
   */
  method?: pulumi.Input<string>;
  /**
   * The name of the 1Password App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a AppConnection1password resource.
 */
export interface AppConnection1passwordArgs {
  /**
   * The credentials for the 1Password App Connection
   */
  credentials: pulumi.Input<inputs.AppConnection1passwordCredentials>;
  /**
   * An optional description for the 1Password App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with 1Password. Possible values are: api-token
   */
  method: pulumi.Input<string>;
  /**
   * The name of the 1Password App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
