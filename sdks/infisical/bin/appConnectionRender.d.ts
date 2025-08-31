import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class AppConnectionRender extends pulumi.CustomResource {
  /**
   * Get an existing AppConnectionRender resource's state with the given name, ID, and optional extra
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
    state?: AppConnectionRenderState,
    opts?: pulumi.CustomResourceOptions,
  ): AppConnectionRender;
  /**
   * Returns true if the given object is an instance of AppConnectionRender.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is AppConnectionRender;
  /**
   * The credentials for the Render App Connection
   */
  readonly credentials: pulumi.Output<outputs.AppConnectionRenderCredentials>;
  /**
   * The hash of the Render App Connection credentials
   */
  readonly credentialsHash: pulumi.Output<string>;
  /**
   * An optional description for the Render App Connection.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The method used to authenticate with Render. Possible values are: api-key
   */
  readonly method: pulumi.Output<string>;
  /**
   * The name of the Render App Connection to create. Must be slug-friendly
   */
  readonly name: pulumi.Output<string>;
  /**
   * Create a AppConnectionRender resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: AppConnectionRenderArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering AppConnectionRender resources.
 */
export interface AppConnectionRenderState {
  /**
   * The credentials for the Render App Connection
   */
  credentials?: pulumi.Input<inputs.AppConnectionRenderCredentials>;
  /**
   * The hash of the Render App Connection credentials
   */
  credentialsHash?: pulumi.Input<string>;
  /**
   * An optional description for the Render App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with Render. Possible values are: api-key
   */
  method?: pulumi.Input<string>;
  /**
   * The name of the Render App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a AppConnectionRender resource.
 */
export interface AppConnectionRenderArgs {
  /**
   * The credentials for the Render App Connection
   */
  credentials: pulumi.Input<inputs.AppConnectionRenderCredentials>;
  /**
   * An optional description for the Render App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with Render. Possible values are: api-key
   */
  method: pulumi.Input<string>;
  /**
   * The name of the Render App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
