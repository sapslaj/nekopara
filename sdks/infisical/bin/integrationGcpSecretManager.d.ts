import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IntegrationGcpSecretManager extends pulumi.CustomResource {
  /**
   * Get an existing IntegrationGcpSecretManager resource's state with the given name, ID, and optional extra
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
    state?: IntegrationGcpSecretManagerState,
    opts?: pulumi.CustomResourceOptions,
  ): IntegrationGcpSecretManager;
  /**
   * Returns true if the given object is an instance of IntegrationGcpSecretManager.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IntegrationGcpSecretManager;
  /**
   * The slug of the environment to sync to GCP Secret Manager (prod, dev, staging, etc).
   */
  readonly environment: pulumi.Output<string>;
  /**
   * The ID of the GCP project.
   */
  readonly gcpProjectId: pulumi.Output<string>;
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
  readonly options: pulumi.Output<outputs.IntegrationGcpSecretManagerOptions>;
  /**
   * The ID of your Infisical project.
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  readonly secretPath: pulumi.Output<string>;
  /**
   * Service account json for the GCP project.
   */
  readonly serviceAccountJson: pulumi.Output<string>;
  /**
   * Create a IntegrationGcpSecretManager resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IntegrationGcpSecretManagerArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IntegrationGcpSecretManager resources.
 */
export interface IntegrationGcpSecretManagerState {
  /**
   * The slug of the environment to sync to GCP Secret Manager (prod, dev, staging, etc).
   */
  environment?: pulumi.Input<string>;
  /**
   * The ID of the GCP project.
   */
  gcpProjectId?: pulumi.Input<string>;
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
  options?: pulumi.Input<inputs.IntegrationGcpSecretManagerOptions>;
  /**
   * The ID of your Infisical project.
   */
  projectId?: pulumi.Input<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  secretPath?: pulumi.Input<string>;
  /**
   * Service account json for the GCP project.
   */
  serviceAccountJson?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IntegrationGcpSecretManager resource.
 */
export interface IntegrationGcpSecretManagerArgs {
  /**
   * The slug of the environment to sync to GCP Secret Manager (prod, dev, staging, etc).
   */
  environment: pulumi.Input<string>;
  /**
   * The ID of the GCP project.
   */
  gcpProjectId: pulumi.Input<string>;
  /**
   * Integration options
   */
  options?: pulumi.Input<inputs.IntegrationGcpSecretManagerOptions>;
  /**
   * The ID of your Infisical project.
   */
  projectId: pulumi.Input<string>;
  /**
   * The secret path in Infisical to sync secrets from.
   */
  secretPath: pulumi.Input<string>;
  /**
   * Service account json for the GCP project.
   */
  serviceAccountJson: pulumi.Input<string>;
}
