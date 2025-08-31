import * as pulumi from "@pulumi/pulumi";
export declare class Group extends pulumi.CustomResource {
  /**
   * Get an existing Group resource's state with the given name, ID, and optional extra
   * properties used to qualify the lookup.
   *
   * @param name The _unique_ name of the resulting resource.
   * @param id The _unique_ provider ID of the resource to lookup.
   * @param state Any extra arguments used during the lookup.
   * @param opts Optional settings to control the behavior of the CustomResource.
   */
  static get(name: string, id: pulumi.Input<pulumi.ID>, state?: GroupState, opts?: pulumi.CustomResourceOptions): Group;
  /**
   * Returns true if the given object is an instance of Group.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is Group;
  /**
   * The name of the group.
   */
  readonly name: pulumi.Output<string>;
  /**
   * The role of the group.
   */
  readonly role: pulumi.Output<string>;
  /**
   * The slug of the group.
   */
  readonly slug: pulumi.Output<string>;
  /**
   * Create a Group resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: GroupArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Group resources.
 */
export interface GroupState {
  /**
   * The name of the group.
   */
  name?: pulumi.Input<string>;
  /**
   * The role of the group.
   */
  role?: pulumi.Input<string>;
  /**
   * The slug of the group.
   */
  slug?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Group resource.
 */
export interface GroupArgs {
  /**
   * The name of the group.
   */
  name?: pulumi.Input<string>;
  /**
   * The role of the group.
   */
  role: pulumi.Input<string>;
  /**
   * The slug of the group.
   */
  slug: pulumi.Input<string>;
}
