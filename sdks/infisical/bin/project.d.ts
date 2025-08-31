import * as pulumi from "@pulumi/pulumi";
export declare class Project extends pulumi.CustomResource {
  /**
   * Get an existing Project resource's state with the given name, ID, and optional extra
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
    state?: ProjectState,
    opts?: pulumi.CustomResourceOptions,
  ): Project;
  /**
   * Returns true if the given object is an instance of Project.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is Project;
  /**
   * The audit log retention in days
   */
  readonly auditLogRetentionDays: pulumi.Output<number>;
  /**
   * The description of the project
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * Whether the project has delete protection, defaults to false
   */
  readonly hasDeleteProtection: pulumi.Output<boolean>;
  /**
   * The ID of the KMS secret manager key to use for the project
   */
  readonly kmsSecretManagerKeyId: pulumi.Output<string>;
  readonly lastUpdated: pulumi.Output<string>;
  /**
   * The name of the project
   */
  readonly name: pulumi.Output<string>;
  /**
   * Whether to create default environments for the project (dev, staging, prod), defaults to true
   */
  readonly shouldCreateDefaultEnvs: pulumi.Output<boolean | undefined>;
  /**
   * The slug of the project
   */
  readonly slug: pulumi.Output<string>;
  /**
   * The name of the template to use for the project
   */
  readonly templateName: pulumi.Output<string | undefined>;
  /**
   * Create a Project resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Project resources.
 */
export interface ProjectState {
  /**
   * The audit log retention in days
   */
  auditLogRetentionDays?: pulumi.Input<number>;
  /**
   * The description of the project
   */
  description?: pulumi.Input<string>;
  /**
   * Whether the project has delete protection, defaults to false
   */
  hasDeleteProtection?: pulumi.Input<boolean>;
  /**
   * The ID of the KMS secret manager key to use for the project
   */
  kmsSecretManagerKeyId?: pulumi.Input<string>;
  lastUpdated?: pulumi.Input<string>;
  /**
   * The name of the project
   */
  name?: pulumi.Input<string>;
  /**
   * Whether to create default environments for the project (dev, staging, prod), defaults to true
   */
  shouldCreateDefaultEnvs?: pulumi.Input<boolean>;
  /**
   * The slug of the project
   */
  slug?: pulumi.Input<string>;
  /**
   * The name of the template to use for the project
   */
  templateName?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Project resource.
 */
export interface ProjectArgs {
  /**
   * The audit log retention in days
   */
  auditLogRetentionDays?: pulumi.Input<number>;
  /**
   * The description of the project
   */
  description?: pulumi.Input<string>;
  /**
   * Whether the project has delete protection, defaults to false
   */
  hasDeleteProtection?: pulumi.Input<boolean>;
  /**
   * The ID of the KMS secret manager key to use for the project
   */
  kmsSecretManagerKeyId?: pulumi.Input<string>;
  /**
   * The name of the project
   */
  name?: pulumi.Input<string>;
  /**
   * Whether to create default environments for the project (dev, staging, prod), defaults to true
   */
  shouldCreateDefaultEnvs?: pulumi.Input<boolean>;
  /**
   * The slug of the project
   */
  slug: pulumi.Input<string>;
  /**
   * The name of the template to use for the project
   */
  templateName?: pulumi.Input<string>;
}
