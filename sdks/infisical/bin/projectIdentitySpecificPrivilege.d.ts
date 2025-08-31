import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ProjectIdentitySpecificPrivilege extends pulumi.CustomResource {
  /**
   * Get an existing ProjectIdentitySpecificPrivilege resource's state with the given name, ID, and optional extra
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
    state?: ProjectIdentitySpecificPrivilegeState,
    opts?: pulumi.CustomResourceOptions,
  ): ProjectIdentitySpecificPrivilege;
  /**
   * Returns true if the given object is an instance of ProjectIdentitySpecificPrivilege.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is ProjectIdentitySpecificPrivilege;
  /**
   * The identity id to create identity specific privilege
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * Flag to indicate the assigned specific privilege is temporary or not. When is_temporary is true fields temporary_mode,
   * temporary_range and temporary_access_start_time is required.
   */
  readonly isTemporary: pulumi.Output<boolean>;
  /**
   * (DEPRECATED, USE permissions_v2. Refer to the migration guide in
   * https://infisical.com/docs/internals/permissions#migrating-from-permission-v1-to-permission-v2) The permissions assigned
   * to the project identity specific privilege
   */
  readonly permission: pulumi.Output<outputs.ProjectIdentitySpecificPrivilegePermission | undefined>;
  /**
   * The permissions assigned to the project identity specific privilege. Refer to the documentation here
   * https://infisical.com/docs/internals/permissions for its usage.
   */
  readonly permissionsV2s: pulumi.Output<outputs.ProjectIdentitySpecificPrivilegePermissionsV2[] | undefined>;
  /**
   * The slug of the project to create identity specific privilege
   */
  readonly projectSlug: pulumi.Output<string>;
  /**
   * The slug for the new privilege
   */
  readonly slug: pulumi.Output<string>;
  /**
   * ISO time for which temporary access will end. Computed based on temporary_range and temporary_access_start_time
   */
  readonly temporaryAccessEndTime: pulumi.Output<string>;
  /**
   * ISO time for which temporary access should begin. The current time is used by default.
   */
  readonly temporaryAccessStartTime: pulumi.Output<string>;
  /**
   * Type of temporary access given. Types: relative. Default: relative
   */
  readonly temporaryMode: pulumi.Output<string>;
  /**
   * TTL for the temporary time. Eg: 1m, 1h, 1d. Default: 1h
   */
  readonly temporaryRange: pulumi.Output<string>;
  /**
   * Create a ProjectIdentitySpecificPrivilege resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectIdentitySpecificPrivilegeArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectIdentitySpecificPrivilege resources.
 */
export interface ProjectIdentitySpecificPrivilegeState {
  /**
   * The identity id to create identity specific privilege
   */
  identityId?: pulumi.Input<string>;
  /**
   * Flag to indicate the assigned specific privilege is temporary or not. When is_temporary is true fields temporary_mode,
   * temporary_range and temporary_access_start_time is required.
   */
  isTemporary?: pulumi.Input<boolean>;
  /**
   * (DEPRECATED, USE permissions_v2. Refer to the migration guide in
   * https://infisical.com/docs/internals/permissions#migrating-from-permission-v1-to-permission-v2) The permissions assigned
   * to the project identity specific privilege
   */
  permission?: pulumi.Input<inputs.ProjectIdentitySpecificPrivilegePermission>;
  /**
   * The permissions assigned to the project identity specific privilege. Refer to the documentation here
   * https://infisical.com/docs/internals/permissions for its usage.
   */
  permissionsV2s?: pulumi.Input<pulumi.Input<inputs.ProjectIdentitySpecificPrivilegePermissionsV2>[]>;
  /**
   * The slug of the project to create identity specific privilege
   */
  projectSlug?: pulumi.Input<string>;
  /**
   * The slug for the new privilege
   */
  slug?: pulumi.Input<string>;
  /**
   * ISO time for which temporary access will end. Computed based on temporary_range and temporary_access_start_time
   */
  temporaryAccessEndTime?: pulumi.Input<string>;
  /**
   * ISO time for which temporary access should begin. The current time is used by default.
   */
  temporaryAccessStartTime?: pulumi.Input<string>;
  /**
   * Type of temporary access given. Types: relative. Default: relative
   */
  temporaryMode?: pulumi.Input<string>;
  /**
   * TTL for the temporary time. Eg: 1m, 1h, 1d. Default: 1h
   */
  temporaryRange?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ProjectIdentitySpecificPrivilege resource.
 */
export interface ProjectIdentitySpecificPrivilegeArgs {
  /**
   * The identity id to create identity specific privilege
   */
  identityId: pulumi.Input<string>;
  /**
   * Flag to indicate the assigned specific privilege is temporary or not. When is_temporary is true fields temporary_mode,
   * temporary_range and temporary_access_start_time is required.
   */
  isTemporary?: pulumi.Input<boolean>;
  /**
   * (DEPRECATED, USE permissions_v2. Refer to the migration guide in
   * https://infisical.com/docs/internals/permissions#migrating-from-permission-v1-to-permission-v2) The permissions assigned
   * to the project identity specific privilege
   */
  permission?: pulumi.Input<inputs.ProjectIdentitySpecificPrivilegePermission>;
  /**
   * The permissions assigned to the project identity specific privilege. Refer to the documentation here
   * https://infisical.com/docs/internals/permissions for its usage.
   */
  permissionsV2s?: pulumi.Input<pulumi.Input<inputs.ProjectIdentitySpecificPrivilegePermissionsV2>[]>;
  /**
   * The slug of the project to create identity specific privilege
   */
  projectSlug: pulumi.Input<string>;
  /**
   * The slug for the new privilege
   */
  slug?: pulumi.Input<string>;
  /**
   * ISO time for which temporary access will end. Computed based on temporary_range and temporary_access_start_time
   */
  temporaryAccessEndTime?: pulumi.Input<string>;
  /**
   * ISO time for which temporary access should begin. The current time is used by default.
   */
  temporaryAccessStartTime?: pulumi.Input<string>;
  /**
   * Type of temporary access given. Types: relative. Default: relative
   */
  temporaryMode?: pulumi.Input<string>;
  /**
   * TTL for the temporary time. Eg: 1m, 1h, 1d. Default: 1h
   */
  temporaryRange?: pulumi.Input<string>;
}
