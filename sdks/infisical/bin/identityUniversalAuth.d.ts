import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IdentityUniversalAuth extends pulumi.CustomResource {
  /**
   * Get an existing IdentityUniversalAuth resource's state with the given name, ID, and optional extra
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
    state?: IdentityUniversalAuthState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityUniversalAuth;
  /**
   * Returns true if the given object is an instance of IdentityUniversalAuth.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityUniversalAuth;
  /**
   * The maximum lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenMaxTtl: pulumi.Output<number>;
  /**
   * The maximum number of times that an access token can be used; a value of 0 implies infinite number of uses. Default:0
   */
  readonly accessTokenNumUsesLimit: pulumi.Output<number>;
  /**
   * A list of IPs or CIDR ranges that access tokens can be used from. You can use 0.0.0.0/0, to allow usage from any network
   * address..
   */
  readonly accessTokenTrustedIps: pulumi.Output<outputs.IdentityUniversalAuthAccessTokenTrustedIp[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenTtl: pulumi.Output<number>;
  /**
   * A list of IPs or CIDR ranges that the Client Secret can be used from together with the Client ID to get back an access
   * token. You can use 0.0.0.0/0, to allow usage from any network address.
   */
  readonly clientSecretTrustedIps: pulumi.Output<outputs.IdentityUniversalAuthClientSecretTrustedIp[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * Create a IdentityUniversalAuth resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityUniversalAuthArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityUniversalAuth resources.
 */
export interface IdentityUniversalAuthState {
  /**
   * The maximum lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenMaxTtl?: pulumi.Input<number>;
  /**
   * The maximum number of times that an access token can be used; a value of 0 implies infinite number of uses. Default:0
   */
  accessTokenNumUsesLimit?: pulumi.Input<number>;
  /**
   * A list of IPs or CIDR ranges that access tokens can be used from. You can use 0.0.0.0/0, to allow usage from any network
   * address..
   */
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityUniversalAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * A list of IPs or CIDR ranges that the Client Secret can be used from together with the Client ID to get back an access
   * token. You can use 0.0.0.0/0, to allow usage from any network address.
   */
  clientSecretTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityUniversalAuthClientSecretTrustedIp>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IdentityUniversalAuth resource.
 */
export interface IdentityUniversalAuthArgs {
  /**
   * The maximum lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenMaxTtl?: pulumi.Input<number>;
  /**
   * The maximum number of times that an access token can be used; a value of 0 implies infinite number of uses. Default:0
   */
  accessTokenNumUsesLimit?: pulumi.Input<number>;
  /**
   * A list of IPs or CIDR ranges that access tokens can be used from. You can use 0.0.0.0/0, to allow usage from any network
   * address..
   */
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityUniversalAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * A list of IPs or CIDR ranges that the Client Secret can be used from together with the Client ID to get back an access
   * token. You can use 0.0.0.0/0, to allow usage from any network address.
   */
  clientSecretTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityUniversalAuthClientSecretTrustedIp>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId: pulumi.Input<string>;
}
