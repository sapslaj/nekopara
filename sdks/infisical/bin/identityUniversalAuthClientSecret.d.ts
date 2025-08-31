import * as pulumi from "@pulumi/pulumi";
export declare class IdentityUniversalAuthClientSecret extends pulumi.CustomResource {
  /**
   * Get an existing IdentityUniversalAuthClientSecret resource's state with the given name, ID, and optional extra
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
    state?: IdentityUniversalAuthClientSecretState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityUniversalAuthClientSecret;
  /**
   * Returns true if the given object is an instance of IdentityUniversalAuthClientSecret.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityUniversalAuthClientSecret;
  /**
   * The client ID of the secret.
   */
  readonly clientId: pulumi.Output<string>;
  /**
   * The client secret.
   */
  readonly clientSecret: pulumi.Output<string>;
  /**
   * The UTC timestamp of the created at.
   */
  readonly createdAt: pulumi.Output<string>;
  /**
   * The description of the client secret.
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The ID of the identity to create a client secret for
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * A flag indicating token has been revoked
   */
  readonly isRevoked: pulumi.Output<boolean>;
  /**
   * The number of times that the client secret is used
   */
  readonly numberOfUses: pulumi.Output<number>;
  /**
   * The maximum number of times that the client secret can be used; a value of 0 implies infinite number of uses. Default: 0
   */
  readonly numberOfUsesLimit: pulumi.Output<number>;
  /**
   * The lifetime for the client secret in seconds. Default: 0 - not expiring
   */
  readonly ttl: pulumi.Output<number>;
  /**
   * Create a IdentityUniversalAuthClientSecret resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityUniversalAuthClientSecretArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityUniversalAuthClientSecret resources.
 */
export interface IdentityUniversalAuthClientSecretState {
  /**
   * The client ID of the secret.
   */
  clientId?: pulumi.Input<string>;
  /**
   * The client secret.
   */
  clientSecret?: pulumi.Input<string>;
  /**
   * The UTC timestamp of the created at.
   */
  createdAt?: pulumi.Input<string>;
  /**
   * The description of the client secret.
   */
  description?: pulumi.Input<string>;
  /**
   * The ID of the identity to create a client secret for
   */
  identityId?: pulumi.Input<string>;
  /**
   * A flag indicating token has been revoked
   */
  isRevoked?: pulumi.Input<boolean>;
  /**
   * The number of times that the client secret is used
   */
  numberOfUses?: pulumi.Input<number>;
  /**
   * The maximum number of times that the client secret can be used; a value of 0 implies infinite number of uses. Default: 0
   */
  numberOfUsesLimit?: pulumi.Input<number>;
  /**
   * The lifetime for the client secret in seconds. Default: 0 - not expiring
   */
  ttl?: pulumi.Input<number>;
}
/**
 * The set of arguments for constructing a IdentityUniversalAuthClientSecret resource.
 */
export interface IdentityUniversalAuthClientSecretArgs {
  /**
   * The description of the client secret.
   */
  description?: pulumi.Input<string>;
  /**
   * The ID of the identity to create a client secret for
   */
  identityId: pulumi.Input<string>;
  /**
   * The maximum number of times that the client secret can be used; a value of 0 implies infinite number of uses. Default: 0
   */
  numberOfUsesLimit?: pulumi.Input<number>;
  /**
   * The lifetime for the client secret in seconds. Default: 0 - not expiring
   */
  ttl?: pulumi.Input<number>;
}
