import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class DynamicSecretSqlDatabase extends pulumi.CustomResource {
  /**
   * Get an existing DynamicSecretSqlDatabase resource's state with the given name, ID, and optional extra
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
    state?: DynamicSecretSqlDatabaseState,
    opts?: pulumi.CustomResourceOptions,
  ): DynamicSecretSqlDatabase;
  /**
   * Returns true if the given object is an instance of DynamicSecretSqlDatabase.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is DynamicSecretSqlDatabase;
  /**
   * The configuration of the dynamic secret
   */
  readonly configuration: pulumi.Output<outputs.DynamicSecretSqlDatabaseConfiguration>;
  /**
   * The default TTL that will be applied for all the leases.
   */
  readonly defaultTtl: pulumi.Output<string>;
  /**
   * The slug of the environment to create the dynamic secret in.
   */
  readonly environmentSlug: pulumi.Output<string>;
  /**
   * The maximum limit a TTL can be leases or renewed.
   */
  readonly maxTtl: pulumi.Output<string | undefined>;
  /**
   * The metadata associated with this dynamic secret
   */
  readonly metadatas: pulumi.Output<outputs.DynamicSecretSqlDatabaseMetadata[] | undefined>;
  /**
   * The name of the dynamic secret.
   */
  readonly name: pulumi.Output<string>;
  /**
   * The path to create the dynamic secret in.
   */
  readonly path: pulumi.Output<string>;
  /**
   * The slug of the project to create dynamic secret in.
   */
  readonly projectSlug: pulumi.Output<string>;
  /**
   * The username template of the dynamic secret
   */
  readonly usernameTemplate: pulumi.Output<string | undefined>;
  /**
   * Create a DynamicSecretSqlDatabase resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: DynamicSecretSqlDatabaseArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering DynamicSecretSqlDatabase resources.
 */
export interface DynamicSecretSqlDatabaseState {
  /**
   * The configuration of the dynamic secret
   */
  configuration?: pulumi.Input<inputs.DynamicSecretSqlDatabaseConfiguration>;
  /**
   * The default TTL that will be applied for all the leases.
   */
  defaultTtl?: pulumi.Input<string>;
  /**
   * The slug of the environment to create the dynamic secret in.
   */
  environmentSlug?: pulumi.Input<string>;
  /**
   * The maximum limit a TTL can be leases or renewed.
   */
  maxTtl?: pulumi.Input<string>;
  /**
   * The metadata associated with this dynamic secret
   */
  metadatas?: pulumi.Input<pulumi.Input<inputs.DynamicSecretSqlDatabaseMetadata>[]>;
  /**
   * The name of the dynamic secret.
   */
  name?: pulumi.Input<string>;
  /**
   * The path to create the dynamic secret in.
   */
  path?: pulumi.Input<string>;
  /**
   * The slug of the project to create dynamic secret in.
   */
  projectSlug?: pulumi.Input<string>;
  /**
   * The username template of the dynamic secret
   */
  usernameTemplate?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a DynamicSecretSqlDatabase resource.
 */
export interface DynamicSecretSqlDatabaseArgs {
  /**
   * The configuration of the dynamic secret
   */
  configuration: pulumi.Input<inputs.DynamicSecretSqlDatabaseConfiguration>;
  /**
   * The default TTL that will be applied for all the leases.
   */
  defaultTtl: pulumi.Input<string>;
  /**
   * The slug of the environment to create the dynamic secret in.
   */
  environmentSlug: pulumi.Input<string>;
  /**
   * The maximum limit a TTL can be leases or renewed.
   */
  maxTtl?: pulumi.Input<string>;
  /**
   * The metadata associated with this dynamic secret
   */
  metadatas?: pulumi.Input<pulumi.Input<inputs.DynamicSecretSqlDatabaseMetadata>[]>;
  /**
   * The name of the dynamic secret.
   */
  name?: pulumi.Input<string>;
  /**
   * The path to create the dynamic secret in.
   */
  path: pulumi.Input<string>;
  /**
   * The slug of the project to create dynamic secret in.
   */
  projectSlug: pulumi.Input<string>;
  /**
   * The username template of the dynamic secret
   */
  usernameTemplate?: pulumi.Input<string>;
}
