import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IdentityOidcAuth extends pulumi.CustomResource {
  /**
   * Get an existing IdentityOidcAuth resource's state with the given name, ID, and optional extra
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
    state?: IdentityOidcAuthState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityOidcAuth;
  /**
   * Returns true if the given object is an instance of IdentityOidcAuth.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityOidcAuth;
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
   * address...
   */
  readonly accessTokenTrustedIps: pulumi.Output<outputs.IdentityOidcAuthAccessTokenTrustedIp[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenTtl: pulumi.Output<number>;
  /**
   * The comma-separated list of intended recipients.
   */
  readonly boundAudiences: pulumi.Output<string[]>;
  /**
   * The attributes that should be present in the JWT for it to be valid. The provided values can be a glob pattern.
   */
  readonly boundClaims: pulumi.Output<{
    [key: string]: string;
  }>;
  /**
   * The unique identifier of the identity provider issuing the OIDC tokens.
   */
  readonly boundIssuer: pulumi.Output<string>;
  /**
   * The expected principal that is the subject of the JWT.
   */
  readonly boundSubject: pulumi.Output<string>;
  /**
   * Map OIDC token claims to metadata fields. Example: {"role": "token.groups"}, this would become
   * identity.metadata.oidc.claims.role
   */
  readonly claimMetadataMapping: pulumi.Output<{
    [key: string]: string;
  }>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * The PEM-encoded CA cert for establishing secure communication with the Identity Provider endpoints
   */
  readonly oidcCaCertificate: pulumi.Output<string>;
  /**
   * The URL used to retrieve the OpenID Connect configuration from the identity provider.
   */
  readonly oidcDiscoveryUrl: pulumi.Output<string>;
  /**
   * Create a IdentityOidcAuth resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityOidcAuthArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityOidcAuth resources.
 */
export interface IdentityOidcAuthState {
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
   * address...
   */
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityOidcAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * The comma-separated list of intended recipients.
   */
  boundAudiences?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The attributes that should be present in the JWT for it to be valid. The provided values can be a glob pattern.
   */
  boundClaims?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>;
  /**
   * The unique identifier of the identity provider issuing the OIDC tokens.
   */
  boundIssuer?: pulumi.Input<string>;
  /**
   * The expected principal that is the subject of the JWT.
   */
  boundSubject?: pulumi.Input<string>;
  /**
   * Map OIDC token claims to metadata fields. Example: {"role": "token.groups"}, this would become
   * identity.metadata.oidc.claims.role
   */
  claimMetadataMapping?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId?: pulumi.Input<string>;
  /**
   * The PEM-encoded CA cert for establishing secure communication with the Identity Provider endpoints
   */
  oidcCaCertificate?: pulumi.Input<string>;
  /**
   * The URL used to retrieve the OpenID Connect configuration from the identity provider.
   */
  oidcDiscoveryUrl?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IdentityOidcAuth resource.
 */
export interface IdentityOidcAuthArgs {
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
   * address...
   */
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityOidcAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * The comma-separated list of intended recipients.
   */
  boundAudiences?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The attributes that should be present in the JWT for it to be valid. The provided values can be a glob pattern.
   */
  boundClaims?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>;
  /**
   * The unique identifier of the identity provider issuing the OIDC tokens.
   */
  boundIssuer: pulumi.Input<string>;
  /**
   * The expected principal that is the subject of the JWT.
   */
  boundSubject?: pulumi.Input<string>;
  /**
   * Map OIDC token claims to metadata fields. Example: {"role": "token.groups"}, this would become
   * identity.metadata.oidc.claims.role
   */
  claimMetadataMapping?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId: pulumi.Input<string>;
  /**
   * The PEM-encoded CA cert for establishing secure communication with the Identity Provider endpoints
   */
  oidcCaCertificate?: pulumi.Input<string>;
  /**
   * The URL used to retrieve the OpenID Connect configuration from the identity provider.
   */
  oidcDiscoveryUrl: pulumi.Input<string>;
}
