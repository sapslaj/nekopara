import * as pulumi from "@pulumi/pulumi";
export declare class SecretImport extends pulumi.CustomResource {
  /**
   * Get an existing SecretImport resource's state with the given name, ID, and optional extra
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
    state?: SecretImportState,
    opts?: pulumi.CustomResourceOptions,
  ): SecretImport;
  /**
   * Returns true if the given object is an instance of SecretImport.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is SecretImport;
  /**
   * The environment slug of the secret import to modify/create
   */
  readonly environmentSlug: pulumi.Output<string>;
  /**
   * The path where the secret should be imported
   */
  readonly folderPath: pulumi.Output<string>;
  /**
   * The environment slug of the secret import to modify/create
   */
  readonly importEnvironmentSlug: pulumi.Output<string>;
  /**
   * The path where the secret should be imported from
   */
  readonly importFolderPath: pulumi.Output<string>;
  /**
   * The is_replication of the secret import to modify/create
   */
  readonly isReplication: pulumi.Output<boolean>;
  /**
   * The Infisical project ID
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * Create a SecretImport resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretImportArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SecretImport resources.
 */
export interface SecretImportState {
  /**
   * The environment slug of the secret import to modify/create
   */
  environmentSlug?: pulumi.Input<string>;
  /**
   * The path where the secret should be imported
   */
  folderPath?: pulumi.Input<string>;
  /**
   * The environment slug of the secret import to modify/create
   */
  importEnvironmentSlug?: pulumi.Input<string>;
  /**
   * The path where the secret should be imported from
   */
  importFolderPath?: pulumi.Input<string>;
  /**
   * The is_replication of the secret import to modify/create
   */
  isReplication?: pulumi.Input<boolean>;
  /**
   * The Infisical project ID
   */
  projectId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a SecretImport resource.
 */
export interface SecretImportArgs {
  /**
   * The environment slug of the secret import to modify/create
   */
  environmentSlug: pulumi.Input<string>;
  /**
   * The path where the secret should be imported
   */
  folderPath: pulumi.Input<string>;
  /**
   * The environment slug of the secret import to modify/create
   */
  importEnvironmentSlug: pulumi.Input<string>;
  /**
   * The path where the secret should be imported from
   */
  importFolderPath: pulumi.Input<string>;
  /**
   * The is_replication of the secret import to modify/create
   */
  isReplication: pulumi.Input<boolean>;
  /**
   * The Infisical project ID
   */
  projectId: pulumi.Input<string>;
}
