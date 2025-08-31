import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IntegrationAwsParameterStore extends pulumi.CustomResource {
  /**
   * Get an existing IntegrationAwsParameterStore resource's state with the given name, ID, and optional extra
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
    state?: IntegrationAwsParameterStoreState,
    opts?: pulumi.CustomResourceOptions,
  ): IntegrationAwsParameterStore;
  /**
   * Returns true if the given object is an instance of IntegrationAwsParameterStore.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IntegrationAwsParameterStore;
  /**
   * The AWS access key ID. Used to authenticate with AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  readonly accessKeyId: pulumi.Output<string | undefined>;
  /**
   * The ARN of the role to assume when syncing secrets to AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  readonly assumeRoleArn: pulumi.Output<string | undefined>;
  /**
   * The AWS region to sync secrets to. (us-east-1, us-east-2, etc)
   */
  readonly awsRegion: pulumi.Output<string>;
  /**
   * The slug of the environment to sync to AWS Parameter Store (prod, dev, staging, etc).
   */
  readonly environment: pulumi.Output<string>;
  /**
   * The ID of the integration auth, used internally by Infisical.
   */
  readonly integrationAuthId: pulumi.Output<string>;
  /**
   * The ID of the integration, used internally by Infisical.
   */
  readonly integrationId: pulumi.Output<string>;
  /**
   * Integration options
   */
  readonly options: pulumi.Output<outputs.IntegrationAwsParameterStoreOptions>;
  /**
   * The path in AWS Parameter Store to sync secrets to.
   */
  readonly parameterStorePath: pulumi.Output<string>;
  /**
   * The ID of your Infisical project.
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The AWS secret access key. Used to authenticate with AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  readonly secretAccessKey: pulumi.Output<string | undefined>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  readonly secretPath: pulumi.Output<string>;
  /**
   * Create a IntegrationAwsParameterStore resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IntegrationAwsParameterStoreArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IntegrationAwsParameterStore resources.
 */
export interface IntegrationAwsParameterStoreState {
  /**
   * The AWS access key ID. Used to authenticate with AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  accessKeyId?: pulumi.Input<string>;
  /**
   * The ARN of the role to assume when syncing secrets to AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  assumeRoleArn?: pulumi.Input<string>;
  /**
   * The AWS region to sync secrets to. (us-east-1, us-east-2, etc)
   */
  awsRegion?: pulumi.Input<string>;
  /**
   * The slug of the environment to sync to AWS Parameter Store (prod, dev, staging, etc).
   */
  environment?: pulumi.Input<string>;
  /**
   * The ID of the integration auth, used internally by Infisical.
   */
  integrationAuthId?: pulumi.Input<string>;
  /**
   * The ID of the integration, used internally by Infisical.
   */
  integrationId?: pulumi.Input<string>;
  /**
   * Integration options
   */
  options?: pulumi.Input<inputs.IntegrationAwsParameterStoreOptions>;
  /**
   * The path in AWS Parameter Store to sync secrets to.
   */
  parameterStorePath?: pulumi.Input<string>;
  /**
   * The ID of your Infisical project.
   */
  projectId?: pulumi.Input<string>;
  /**
   * The AWS secret access key. Used to authenticate with AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  secretAccessKey?: pulumi.Input<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  secretPath?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IntegrationAwsParameterStore resource.
 */
export interface IntegrationAwsParameterStoreArgs {
  /**
   * The AWS access key ID. Used to authenticate with AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  accessKeyId?: pulumi.Input<string>;
  /**
   * The ARN of the role to assume when syncing secrets to AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  assumeRoleArn?: pulumi.Input<string>;
  /**
   * The AWS region to sync secrets to. (us-east-1, us-east-2, etc)
   */
  awsRegion: pulumi.Input<string>;
  /**
   * The slug of the environment to sync to AWS Parameter Store (prod, dev, staging, etc).
   */
  environment: pulumi.Input<string>;
  /**
   * Integration options
   */
  options?: pulumi.Input<inputs.IntegrationAwsParameterStoreOptions>;
  /**
   * The path in AWS Parameter Store to sync secrets to.
   */
  parameterStorePath: pulumi.Input<string>;
  /**
   * The ID of your Infisical project.
   */
  projectId: pulumi.Input<string>;
  /**
   * The AWS secret access key. Used to authenticate with AWS Parameter Store. You must either set secret_access_key and
   * access_key_id, or set assume_role_arn to assume a role.
   */
  secretAccessKey?: pulumi.Input<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  secretPath: pulumi.Input<string>;
}
