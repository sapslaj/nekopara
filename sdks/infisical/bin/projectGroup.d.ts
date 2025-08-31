import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ProjectGroup extends pulumi.CustomResource {
  /**
   * Get an existing ProjectGroup resource's state with the given name, ID, and optional extra
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
    state?: ProjectGroupState,
    opts?: pulumi.CustomResourceOptions,
  ): ProjectGroup;
  /**
   * Returns true if the given object is an instance of ProjectGroup.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is ProjectGroup;
  /**
   * The id of the group.
   */
  readonly groupId: pulumi.Output<string>;
  /**
   * The name of the group.
   */
  readonly groupName: pulumi.Output<string | undefined>;
  /**
   * The membership Id of the project group
   */
  readonly membershipId: pulumi.Output<string>;
  /**
   * The id of the project.
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The roles assigned to the project group
   */
  readonly roles: pulumi.Output<outputs.ProjectGroupRole[]>;
  /**
   * Create a ProjectGroup resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectGroupArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectGroup resources.
 */
export interface ProjectGroupState {
  /**
   * The id of the group.
   */
  groupId?: pulumi.Input<string>;
  /**
   * The name of the group.
   */
  groupName?: pulumi.Input<string>;
  /**
   * The membership Id of the project group
   */
  membershipId?: pulumi.Input<string>;
  /**
   * The id of the project.
   */
  projectId?: pulumi.Input<string>;
  /**
   * The roles assigned to the project group
   */
  roles?: pulumi.Input<pulumi.Input<inputs.ProjectGroupRole>[]>;
}
/**
 * The set of arguments for constructing a ProjectGroup resource.
 */
export interface ProjectGroupArgs {
  /**
   * The id of the group.
   */
  groupId?: pulumi.Input<string>;
  /**
   * The name of the group.
   */
  groupName?: pulumi.Input<string>;
  /**
   * The id of the project.
   */
  projectId: pulumi.Input<string>;
  /**
   * The roles assigned to the project group
   */
  roles: pulumi.Input<pulumi.Input<inputs.ProjectGroupRole>[]>;
}
