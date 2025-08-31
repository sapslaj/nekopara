import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ProjectRole extends pulumi.CustomResource {
  /**
   * Get an existing ProjectRole resource's state with the given name, ID, and optional extra
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
    state?: ProjectRoleState,
    opts?: pulumi.CustomResourceOptions,
  ): ProjectRole;
  /**
   * Returns true if the given object is an instance of ProjectRole.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is ProjectRole;
  /**
   * The description for the new role. Defaults to an empty string.
   */
  readonly description: pulumi.Output<string>;
  /**
   * The name for the new role
   */
  readonly name: pulumi.Output<string>;
  /**
   * (DEPRECATED, USE permissions_v2. Refer to the migration guide in
   * https://infisical.com/docs/internals/permissions#migrating-from-permission-v1-to-permission-v2) The permissions assigned
   * to the project role
   */
  readonly permissions: pulumi.Output<outputs.ProjectRolePermission[] | undefined>;
  /**
   * The permissions assigned to the project role. Refer to the documentation here
   * https://infisical.com/docs/internals/permissions for its usage.
   */
  readonly permissionsV2s: pulumi.Output<outputs.ProjectRolePermissionsV2[] | undefined>;
  /**
   * The slug of the project to create role
   */
  readonly projectSlug: pulumi.Output<string>;
  /**
   * The slug for the new role
   */
  readonly slug: pulumi.Output<string>;
  /**
   * Create a ProjectRole resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectRoleArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectRole resources.
 */
export interface ProjectRoleState {
  /**
   * The description for the new role. Defaults to an empty string.
   */
  description?: pulumi.Input<string>;
  /**
   * The name for the new role
   */
  name?: pulumi.Input<string>;
  /**
   * (DEPRECATED, USE permissions_v2. Refer to the migration guide in
   * https://infisical.com/docs/internals/permissions#migrating-from-permission-v1-to-permission-v2) The permissions assigned
   * to the project role
   */
  permissions?: pulumi.Input<pulumi.Input<inputs.ProjectRolePermission>[]>;
  /**
   * The permissions assigned to the project role. Refer to the documentation here
   * https://infisical.com/docs/internals/permissions for its usage.
   */
  permissionsV2s?: pulumi.Input<pulumi.Input<inputs.ProjectRolePermissionsV2>[]>;
  /**
   * The slug of the project to create role
   */
  projectSlug?: pulumi.Input<string>;
  /**
   * The slug for the new role
   */
  slug?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ProjectRole resource.
 */
export interface ProjectRoleArgs {
  /**
   * The description for the new role. Defaults to an empty string.
   */
  description?: pulumi.Input<string>;
  /**
   * The name for the new role
   */
  name?: pulumi.Input<string>;
  /**
   * (DEPRECATED, USE permissions_v2. Refer to the migration guide in
   * https://infisical.com/docs/internals/permissions#migrating-from-permission-v1-to-permission-v2) The permissions assigned
   * to the project role
   */
  permissions?: pulumi.Input<pulumi.Input<inputs.ProjectRolePermission>[]>;
  /**
   * The permissions assigned to the project role. Refer to the documentation here
   * https://infisical.com/docs/internals/permissions for its usage.
   */
  permissionsV2s?: pulumi.Input<pulumi.Input<inputs.ProjectRolePermissionsV2>[]>;
  /**
   * The slug of the project to create role
   */
  projectSlug: pulumi.Input<string>;
  /**
   * The slug for the new role
   */
  slug: pulumi.Input<string>;
}
