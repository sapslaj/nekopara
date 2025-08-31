import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Secret extends pulumi.CustomResource {
  /**
   * Get an existing Secret resource's state with the given name, ID, and optional extra
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
    state?: SecretState,
    opts?: pulumi.CustomResourceOptions,
  ): Secret;
  /**
   * Returns true if the given object is an instance of Secret.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is Secret;
  /**
   * The environment slug of the secret to modify/create
   */
  readonly envSlug: pulumi.Output<string>;
  /**
   * The path to the folder where the given secret resides
   */
  readonly folderPath: pulumi.Output<string>;
  readonly lastUpdated: pulumi.Output<string>;
  /**
   * The name of the secret
   */
  readonly name: pulumi.Output<string>;
  readonly secretReminder: pulumi.Output<outputs.SecretSecretReminder | undefined>;
  /**
   * Tag ids to be attached for the secrets.
   */
  readonly tagIds: pulumi.Output<string[] | undefined>;
  /**
   * The value of the secret
   */
  readonly value: pulumi.Output<string>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  readonly workspaceId: pulumi.Output<string>;
  /**
   * Create a Secret resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Secret resources.
 */
export interface SecretState {
  /**
   * The environment slug of the secret to modify/create
   */
  envSlug?: pulumi.Input<string>;
  /**
   * The path to the folder where the given secret resides
   */
  folderPath?: pulumi.Input<string>;
  lastUpdated?: pulumi.Input<string>;
  /**
   * The name of the secret
   */
  name?: pulumi.Input<string>;
  secretReminder?: pulumi.Input<inputs.SecretSecretReminder>;
  /**
   * Tag ids to be attached for the secrets.
   */
  tagIds?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The value of the secret
   */
  value?: pulumi.Input<string>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  workspaceId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Secret resource.
 */
export interface SecretArgs {
  /**
   * The environment slug of the secret to modify/create
   */
  envSlug: pulumi.Input<string>;
  /**
   * The path to the folder where the given secret resides
   */
  folderPath: pulumi.Input<string>;
  /**
   * The name of the secret
   */
  name?: pulumi.Input<string>;
  secretReminder?: pulumi.Input<inputs.SecretSecretReminder>;
  /**
   * Tag ids to be attached for the secrets.
   */
  tagIds?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The value of the secret
   */
  value: pulumi.Input<string>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  workspaceId?: pulumi.Input<string>;
}
