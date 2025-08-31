import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ProjectIdentity extends pulumi.CustomResource {
  /**
   * Get an existing ProjectIdentity resource's state with the given name, ID, and optional extra
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
    state?: ProjectIdentityState,
    opts?: pulumi.CustomResourceOptions,
  ): ProjectIdentity;
  /**
   * Returns true if the given object is an instance of ProjectIdentity.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is ProjectIdentity;
  /**
   * The identity details of the project identity
   */
  readonly identity: pulumi.Output<outputs.ProjectIdentityIdentity>;
  /**
   * The id of the identity.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * The membership Id of the project identity
   */
  readonly membershipId: pulumi.Output<string>;
  /**
   * The id of the project
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The roles assigned to the project identity
   */
  readonly roles: pulumi.Output<outputs.ProjectIdentityRole[]>;
  /**
   * Create a ProjectIdentity resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectIdentityArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectIdentity resources.
 */
export interface ProjectIdentityState {
  /**
   * The identity details of the project identity
   */
  identity?: pulumi.Input<inputs.ProjectIdentityIdentity>;
  /**
   * The id of the identity.
   */
  identityId?: pulumi.Input<string>;
  /**
   * The membership Id of the project identity
   */
  membershipId?: pulumi.Input<string>;
  /**
   * The id of the project
   */
  projectId?: pulumi.Input<string>;
  /**
   * The roles assigned to the project identity
   */
  roles?: pulumi.Input<pulumi.Input<inputs.ProjectIdentityRole>[]>;
}
/**
 * The set of arguments for constructing a ProjectIdentity resource.
 */
export interface ProjectIdentityArgs {
  /**
   * The id of the identity.
   */
  identityId: pulumi.Input<string>;
  /**
   * The id of the project
   */
  projectId: pulumi.Input<string>;
  /**
   * The roles assigned to the project identity
   */
  roles: pulumi.Input<pulumi.Input<inputs.ProjectIdentityRole>[]>;
}
