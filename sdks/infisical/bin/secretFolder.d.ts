import * as pulumi from "@pulumi/pulumi";
export declare class SecretFolder extends pulumi.CustomResource {
  /**
   * Get an existing SecretFolder resource's state with the given name, ID, and optional extra
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
    state?: SecretFolderState,
    opts?: pulumi.CustomResourceOptions,
  ): SecretFolder;
  /**
   * Returns true if the given object is an instance of SecretFolder.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is SecretFolder;
  /**
   * The ID of the environment
   */
  readonly environmentId: pulumi.Output<string>;
  /**
   * The environment slug of the folder to modify/create
   */
  readonly environmentSlug: pulumi.Output<string>;
  /**
   * The path where the folder should be created/updated
   */
  readonly folderPath: pulumi.Output<string>;
  /**
   * The name for the folder
   */
  readonly name: pulumi.Output<string>;
  /**
   * The full path of the folder, including its name.
   */
  readonly path: pulumi.Output<string>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * Create a SecretFolder resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretFolderArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SecretFolder resources.
 */
export interface SecretFolderState {
  /**
   * The ID of the environment
   */
  environmentId?: pulumi.Input<string>;
  /**
   * The environment slug of the folder to modify/create
   */
  environmentSlug?: pulumi.Input<string>;
  /**
   * The path where the folder should be created/updated
   */
  folderPath?: pulumi.Input<string>;
  /**
   * The name for the folder
   */
  name?: pulumi.Input<string>;
  /**
   * The full path of the folder, including its name.
   */
  path?: pulumi.Input<string>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  projectId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a SecretFolder resource.
 */
export interface SecretFolderArgs {
  /**
   * The environment slug of the folder to modify/create
   */
  environmentSlug: pulumi.Input<string>;
  /**
   * The path where the folder should be created/updated
   */
  folderPath: pulumi.Input<string>;
  /**
   * The name for the folder
   */
  name?: pulumi.Input<string>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  projectId: pulumi.Input<string>;
}
