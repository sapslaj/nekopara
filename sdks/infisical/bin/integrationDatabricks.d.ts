import * as pulumi from "@pulumi/pulumi";
export declare class IntegrationDatabricks extends pulumi.CustomResource {
  /**
   * Get an existing IntegrationDatabricks resource's state with the given name, ID, and optional extra
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
    state?: IntegrationDatabricksState,
    opts?: pulumi.CustomResourceOptions,
  ): IntegrationDatabricks;
  /**
   * Returns true if the given object is an instance of IntegrationDatabricks.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IntegrationDatabricks;
  /**
   * The Databricks host URL.
   */
  readonly databricksHost: pulumi.Output<string>;
  /**
   * The Databricks secret scope. Example: your-secret-scope
   */
  readonly databricksSecretScope: pulumi.Output<string>;
  /**
   * The Databricks access token.
   */
  readonly databricksToken: pulumi.Output<string>;
  /**
   * The slug of the environment to sync to Databricks (prod, dev, staging, etc).
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
   * The ID of your Infisical project.
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  readonly secretPath: pulumi.Output<string>;
  /**
   * Create a IntegrationDatabricks resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IntegrationDatabricksArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IntegrationDatabricks resources.
 */
export interface IntegrationDatabricksState {
  /**
   * The Databricks host URL.
   */
  databricksHost?: pulumi.Input<string>;
  /**
   * The Databricks secret scope. Example: your-secret-scope
   */
  databricksSecretScope?: pulumi.Input<string>;
  /**
   * The Databricks access token.
   */
  databricksToken?: pulumi.Input<string>;
  /**
   * The slug of the environment to sync to Databricks (prod, dev, staging, etc).
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
   * The ID of your Infisical project.
   */
  projectId?: pulumi.Input<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  secretPath?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IntegrationDatabricks resource.
 */
export interface IntegrationDatabricksArgs {
  /**
   * The Databricks host URL.
   */
  databricksHost: pulumi.Input<string>;
  /**
   * The Databricks secret scope. Example: your-secret-scope
   */
  databricksSecretScope: pulumi.Input<string>;
  /**
   * The Databricks access token.
   */
  databricksToken: pulumi.Input<string>;
  /**
   * The slug of the environment to sync to Databricks (prod, dev, staging, etc).
   */
  environment: pulumi.Input<string>;
  /**
   * The ID of your Infisical project.
   */
  projectId: pulumi.Input<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  secretPath: pulumi.Input<string>;
}
