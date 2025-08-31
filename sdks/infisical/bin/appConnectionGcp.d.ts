import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class AppConnectionGcp extends pulumi.CustomResource {
  /**
   * Get an existing AppConnectionGcp resource's state with the given name, ID, and optional extra
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
    state?: AppConnectionGcpState,
    opts?: pulumi.CustomResourceOptions,
  ): AppConnectionGcp;
  /**
   * Returns true if the given object is an instance of AppConnectionGcp.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is AppConnectionGcp;
  /**
   * The credentials for the GCP App Connection
   */
  readonly credentials: pulumi.Output<outputs.AppConnectionGcpCredentials>;
  /**
   * The hash of the GCP App Connection credentials
   */
  readonly credentialsHash: pulumi.Output<string>;
  /**
   * An optional description for the GCP App Connection.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The method used to authenticate with GCP. Possible values are: service-account-impersonation
   */
  readonly method: pulumi.Output<string>;
  /**
   * The name of the GCP App Connection to create. Must be slug-friendly
   */
  readonly name: pulumi.Output<string>;
  /**
   * Create a AppConnectionGcp resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: AppConnectionGcpArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering AppConnectionGcp resources.
 */
export interface AppConnectionGcpState {
  /**
   * The credentials for the GCP App Connection
   */
  credentials?: pulumi.Input<inputs.AppConnectionGcpCredentials>;
  /**
   * The hash of the GCP App Connection credentials
   */
  credentialsHash?: pulumi.Input<string>;
  /**
   * An optional description for the GCP App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with GCP. Possible values are: service-account-impersonation
   */
  method?: pulumi.Input<string>;
  /**
   * The name of the GCP App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a AppConnectionGcp resource.
 */
export interface AppConnectionGcpArgs {
  /**
   * The credentials for the GCP App Connection
   */
  credentials: pulumi.Input<inputs.AppConnectionGcpCredentials>;
  /**
   * An optional description for the GCP App Connection.
   */
  description?: pulumi.Input<string>;
  /**
   * The method used to authenticate with GCP. Possible values are: service-account-impersonation
   */
  method: pulumi.Input<string>;
  /**
   * The name of the GCP App Connection to create. Must be slug-friendly
   */
  name?: pulumi.Input<string>;
}
