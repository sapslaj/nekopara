import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class SecretSyncAwsSecretsManager extends pulumi.CustomResource {
  /**
   * Get an existing SecretSyncAwsSecretsManager resource's state with the given name, ID, and optional extra
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
    state?: SecretSyncAwsSecretsManagerState,
    opts?: pulumi.CustomResourceOptions,
  ): SecretSyncAwsSecretsManager;
  /**
   * Returns true if the given object is an instance of SecretSyncAwsSecretsManager.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is SecretSyncAwsSecretsManager;
  /**
   * Whether secrets should be automatically synced when changes occur at the source location or not.
   */
  readonly autoSyncEnabled: pulumi.Output<boolean>;
  /**
   * The ID of the aws Connection to use for syncing.
   */
  readonly connectionId: pulumi.Output<string>;
  /**
   * An optional description for the AWS Secrets Manager sync.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The destination configuration for the secret sync.
   */
  readonly destinationConfig: pulumi.Output<outputs.SecretSyncAwsSecretsManagerDestinationConfig>;
  /**
   * The slug of the project environment to sync secrets from.
   */
  readonly environment: pulumi.Output<string>;
  /**
   * The name of the AWS Secrets Manager sync to create. Must be slug-friendly.
   */
  readonly name: pulumi.Output<string>;
  /**
   * The ID of the Infisical project to create the sync in.
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The folder path to sync secrets from.
   */
  readonly secretPath: pulumi.Output<string>;
  /**
   * Parameters to modify how secrets are synced.
   */
  readonly syncOptions: pulumi.Output<outputs.SecretSyncAwsSecretsManagerSyncOptions>;
  /**
   * Create a SecretSyncAwsSecretsManager resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretSyncAwsSecretsManagerArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SecretSyncAwsSecretsManager resources.
 */
export interface SecretSyncAwsSecretsManagerState {
  /**
   * Whether secrets should be automatically synced when changes occur at the source location or not.
   */
  autoSyncEnabled?: pulumi.Input<boolean>;
  /**
   * The ID of the aws Connection to use for syncing.
   */
  connectionId?: pulumi.Input<string>;
  /**
   * An optional description for the AWS Secrets Manager sync.
   */
  description?: pulumi.Input<string>;
  /**
   * The destination configuration for the secret sync.
   */
  destinationConfig?: pulumi.Input<inputs.SecretSyncAwsSecretsManagerDestinationConfig>;
  /**
   * The slug of the project environment to sync secrets from.
   */
  environment?: pulumi.Input<string>;
  /**
   * The name of the AWS Secrets Manager sync to create. Must be slug-friendly.
   */
  name?: pulumi.Input<string>;
  /**
   * The ID of the Infisical project to create the sync in.
   */
  projectId?: pulumi.Input<string>;
  /**
   * The folder path to sync secrets from.
   */
  secretPath?: pulumi.Input<string>;
  /**
   * Parameters to modify how secrets are synced.
   */
  syncOptions?: pulumi.Input<inputs.SecretSyncAwsSecretsManagerSyncOptions>;
}
/**
 * The set of arguments for constructing a SecretSyncAwsSecretsManager resource.
 */
export interface SecretSyncAwsSecretsManagerArgs {
  /**
   * Whether secrets should be automatically synced when changes occur at the source location or not.
   */
  autoSyncEnabled?: pulumi.Input<boolean>;
  /**
   * The ID of the aws Connection to use for syncing.
   */
  connectionId: pulumi.Input<string>;
  /**
   * An optional description for the AWS Secrets Manager sync.
   */
  description?: pulumi.Input<string>;
  /**
   * The destination configuration for the secret sync.
   */
  destinationConfig: pulumi.Input<inputs.SecretSyncAwsSecretsManagerDestinationConfig>;
  /**
   * The slug of the project environment to sync secrets from.
   */
  environment: pulumi.Input<string>;
  /**
   * The name of the AWS Secrets Manager sync to create. Must be slug-friendly.
   */
  name?: pulumi.Input<string>;
  /**
   * The ID of the Infisical project to create the sync in.
   */
  projectId: pulumi.Input<string>;
  /**
   * The folder path to sync secrets from.
   */
  secretPath: pulumi.Input<string>;
  /**
   * Parameters to modify how secrets are synced.
   */
  syncOptions: pulumi.Input<inputs.SecretSyncAwsSecretsManagerSyncOptions>;
}
