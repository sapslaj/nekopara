import * as pulumi from "@pulumi/pulumi";
export declare class IntegrationCircleci extends pulumi.CustomResource {
  /**
   * Get an existing IntegrationCircleci resource's state with the given name, ID, and optional extra
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
    state?: IntegrationCircleciState,
    opts?: pulumi.CustomResourceOptions,
  ): IntegrationCircleci;
  /**
   * Returns true if the given object is an instance of IntegrationCircleci.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IntegrationCircleci;
  /**
   * The organization slug of your CircleCI organization.
   */
  readonly circleciOrgSlug: pulumi.Output<string>;
  /**
   * The project ID of your CircleCI project.
   */
  readonly circleciProjectId: pulumi.Output<string>;
  /**
   * Your personal CircleCI token to authenticate with.
   */
  readonly circleciToken: pulumi.Output<string>;
  /**
   * The slug of the environment to sync to CircleCI (prod, dev, staging, etc).
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
   * Create a IntegrationCircleci resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IntegrationCircleciArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IntegrationCircleci resources.
 */
export interface IntegrationCircleciState {
  /**
   * The organization slug of your CircleCI organization.
   */
  circleciOrgSlug?: pulumi.Input<string>;
  /**
   * The project ID of your CircleCI project.
   */
  circleciProjectId?: pulumi.Input<string>;
  /**
   * Your personal CircleCI token to authenticate with.
   */
  circleciToken?: pulumi.Input<string>;
  /**
   * The slug of the environment to sync to CircleCI (prod, dev, staging, etc).
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
 * The set of arguments for constructing a IntegrationCircleci resource.
 */
export interface IntegrationCircleciArgs {
  /**
   * The organization slug of your CircleCI organization.
   */
  circleciOrgSlug: pulumi.Input<string>;
  /**
   * The project ID of your CircleCI project.
   */
  circleciProjectId: pulumi.Input<string>;
  /**
   * Your personal CircleCI token to authenticate with.
   */
  circleciToken: pulumi.Input<string>;
  /**
   * The slug of the environment to sync to CircleCI (prod, dev, staging, etc).
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
