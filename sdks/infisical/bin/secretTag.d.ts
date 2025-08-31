import * as pulumi from "@pulumi/pulumi";
export declare class SecretTag extends pulumi.CustomResource {
  /**
   * Get an existing SecretTag resource's state with the given name, ID, and optional extra
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
    state?: SecretTagState,
    opts?: pulumi.CustomResourceOptions,
  ): SecretTag;
  /**
   * Returns true if the given object is an instance of SecretTag.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is SecretTag;
  /**
   * Color code for the tag.
   */
  readonly color: pulumi.Output<string>;
  /**
   * The name for the new tag
   */
  readonly name: pulumi.Output<string>;
  /**
   * The project id associated with the secret tag
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The slug for the new tag
   */
  readonly slug: pulumi.Output<string>;
  /**
   * Create a SecretTag resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretTagArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SecretTag resources.
 */
export interface SecretTagState {
  /**
   * Color code for the tag.
   */
  color?: pulumi.Input<string>;
  /**
   * The name for the new tag
   */
  name?: pulumi.Input<string>;
  /**
   * The project id associated with the secret tag
   */
  projectId?: pulumi.Input<string>;
  /**
   * The slug for the new tag
   */
  slug?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a SecretTag resource.
 */
export interface SecretTagArgs {
  /**
   * Color code for the tag.
   */
  color: pulumi.Input<string>;
  /**
   * The name for the new tag
   */
  name?: pulumi.Input<string>;
  /**
   * The project id associated with the secret tag
   */
  projectId: pulumi.Input<string>;
  /**
   * The slug for the new tag
   */
  slug: pulumi.Input<string>;
}
