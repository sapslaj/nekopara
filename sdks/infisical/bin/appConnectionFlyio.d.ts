import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class AppConnectionFlyio extends pulumi.CustomResource {
  /**
   * Get an existing AppConnectionFlyio resource's state with the given name, ID, and optional extra
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
    state?: AppConnectionFlyioState,
    opts?: pulumi.CustomResourceOptions,
  ): AppConnectionFlyio;
  /**
   * Returns true if the given object is an instance of AppConnectionFlyio.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is AppConnectionFlyio;
  /**
   * The credentials for the Fly.io App Connection
   */
  readonly credentials: pulumi.Output<outputs.AppConnectionFlyioCredentials>;
  /**
   * The hash of the Fly.io App Connection credentials
   */
  readonly credentialsHash: pulumi.Output<string>;
  /**
   * An optional description for the Fly.io App Connection.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The method used to authenticate with Fly.io. Possible values are: access-token
   */
  readonly method: pulumi.Output<string>;
  /**
   * The name of the Fly.io App Connection to create. Must be slug-friendly
   */
  readonly name: pulumi.Output<string>;
  /**
   * Create a AppConnectionFlyio resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: AppConnectionFlyioArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering AppConnectionFlyio resources.
 */
export interface AppConnectionFlyioState {
  /**
   * The credentials for the Fly.io App Connection
   */
  credentials?: pulumi.Input<inputs.AppConnectionFlyioCredentials>;
  /**
   * The hash of the Fly.io App Connection credentials
   */
  credentialsHash?: pulumi.Input<string>;
  /**
   * An optional description for the Fly.io App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with Fly.io. Possible values are: access-token
   */
  method?: pulumi.Input<string>;
  /**
   * The name of the Fly.io App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a AppConnectionFlyio resource.
 */
export interface AppConnectionFlyioArgs {
  /**
   * The credentials for the Fly.io App Connection
   */
  credentials: pulumi.Input<inputs.AppConnectionFlyioCredentials>;
  /**
   * An optional description for the Fly.io App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with Fly.io. Possible values are: access-token
   */
  method: pulumi.Input<string>;
  /**
   * The name of the Fly.io App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
