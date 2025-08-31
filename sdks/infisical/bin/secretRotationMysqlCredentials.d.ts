import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class SecretRotationMysqlCredentials extends pulumi.CustomResource {
  /**
   * Get an existing SecretRotationMysqlCredentials resource's state with the given name, ID, and optional extra
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
    state?: SecretRotationMysqlCredentialsState,
    opts?: pulumi.CustomResourceOptions,
  ): SecretRotationMysqlCredentials;
  /**
   * Returns true if the given object is an instance of SecretRotationMysqlCredentials.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is SecretRotationMysqlCredentials;
  /**
   * Whether secrets should be automatically rotated.
   */
  readonly autoRotationEnabled: pulumi.Output<boolean>;
  /**
   * The ID of the connection to use for the secret rotation.
   */
  readonly connectionId: pulumi.Output<string>;
  /**
   * The description of the secret rotation.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The slug of the project environment to rotate secrets from.
   */
  readonly environment: pulumi.Output<string>;
  /**
   * The name of the secret rotation.
   */
  readonly name: pulumi.Output<string>;
  /**
   * Parameters to modify how secrets are rotated.
   */
  readonly parameters: pulumi.Output<outputs.SecretRotationMysqlCredentialsParameters>;
  /**
   * The ID of the Infisical project to create the secret rotation in.
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * At which UTC time the rotation should occur.
   */
  readonly rotateAtUtc: pulumi.Output<outputs.SecretRotationMysqlCredentialsRotateAtUtc>;
  /**
   * How many days to wait between each rotation.
   */
  readonly rotationInterval: pulumi.Output<number>;
  /**
   * The folder path to rotate secrets from.
   */
  readonly secretPath: pulumi.Output<string>;
  /**
   * Secret mappings to modify how secrets are rotated.
   */
  readonly secretsMapping: pulumi.Output<outputs.SecretRotationMysqlCredentialsSecretsMapping>;
  /**
   * Temporary parameters to modify how secrets are rotated.
   */
  readonly temporaryParameters: pulumi.Output<outputs.SecretRotationMysqlCredentialsTemporaryParameters | undefined>;
  /**
   * Create a SecretRotationMysqlCredentials resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretRotationMysqlCredentialsArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SecretRotationMysqlCredentials resources.
 */
export interface SecretRotationMysqlCredentialsState {
  /**
   * Whether secrets should be automatically rotated.
   */
  autoRotationEnabled?: pulumi.Input<boolean>;
  /**
   * The ID of the connection to use for the secret rotation.
   */
  connectionId?: pulumi.Input<string>;
  /**
   * The description of the secret rotation.
   */
  description?: pulumi.Input<string>;
  /**
   * The slug of the project environment to rotate secrets from.
   */
  environment?: pulumi.Input<string>;
  /**
   * The name of the secret rotation.
   */
  name?: pulumi.Input<string>;
  /**
   * Parameters to modify how secrets are rotated.
   */
  parameters?: pulumi.Input<inputs.SecretRotationMysqlCredentialsParameters>;
  /**
   * The ID of the Infisical project to create the secret rotation in.
   */
  projectId?: pulumi.Input<string>;
  /**
   * At which UTC time the rotation should occur.
   */
  rotateAtUtc?: pulumi.Input<inputs.SecretRotationMysqlCredentialsRotateAtUtc>;
  /**
   * How many days to wait between each rotation.
   */
  rotationInterval?: pulumi.Input<number>;
  /**
   * The folder path to rotate secrets from.
   */
  secretPath?: pulumi.Input<string>;
  /**
   * Secret mappings to modify how secrets are rotated.
   */
  secretsMapping?: pulumi.Input<inputs.SecretRotationMysqlCredentialsSecretsMapping>;
  /**
   * Temporary parameters to modify how secrets are rotated.
   */
  temporaryParameters?: pulumi.Input<inputs.SecretRotationMysqlCredentialsTemporaryParameters>;
}
/**
 * The set of arguments for constructing a SecretRotationMysqlCredentials resource.
 */
export interface SecretRotationMysqlCredentialsArgs {
  /**
   * Whether secrets should be automatically rotated.
   */
  autoRotationEnabled?: pulumi.Input<boolean>;
  /**
   * The ID of the connection to use for the secret rotation.
   */
  connectionId: pulumi.Input<string>;
  /**
   * The description of the secret rotation.
   */
  description?: pulumi.Input<string>;
  /**
   * The slug of the project environment to rotate secrets from.
   */
  environment: pulumi.Input<string>;
  /**
   * The name of the secret rotation.
   */
  name?: pulumi.Input<string>;
  /**
   * Parameters to modify how secrets are rotated.
   */
  parameters: pulumi.Input<inputs.SecretRotationMysqlCredentialsParameters>;
  /**
   * The ID of the Infisical project to create the secret rotation in.
   */
  projectId: pulumi.Input<string>;
  /**
   * At which UTC time the rotation should occur.
   */
  rotateAtUtc?: pulumi.Input<inputs.SecretRotationMysqlCredentialsRotateAtUtc>;
  /**
   * How many days to wait between each rotation.
   */
  rotationInterval?: pulumi.Input<number>;
  /**
   * The folder path to rotate secrets from.
   */
  secretPath: pulumi.Input<string>;
  /**
   * Secret mappings to modify how secrets are rotated.
   */
  secretsMapping: pulumi.Input<inputs.SecretRotationMysqlCredentialsSecretsMapping>;
  /**
   * Temporary parameters to modify how secrets are rotated.
   */
  temporaryParameters?: pulumi.Input<inputs.SecretRotationMysqlCredentialsTemporaryParameters>;
}
