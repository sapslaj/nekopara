import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IdentityAwsAuth extends pulumi.CustomResource {
  /**
   * Get an existing IdentityAwsAuth resource's state with the given name, ID, and optional extra
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
    state?: IdentityAwsAuthState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityAwsAuth;
  /**
   * Returns true if the given object is an instance of IdentityAwsAuth.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityAwsAuth;
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
  readonly accessTokenTrustedIps: pulumi.Output<outputs.IdentityAwsAuthAccessTokenTrustedIp[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenTtl: pulumi.Output<number>;
  /**
   * List of trusted AWS account IDs that are allowed to authenticate with Infisical.
   */
  readonly allowedAccountIds: pulumi.Output<string[]>;
  /**
   * List of trusted IAM principal ARNs that are allowed to authenticate with Infisical. The values should take one of three
   * forms: `arn:aws:iam::123456789012:user/MyUserName`, `arn:aws:iam::123456789012:role/MyRoleName`, or
   * `arn:aws:iam::123456789012:*`. Using a wildcard in this case allows any IAM principal in the account `123456789012` to
   * authenticate with Infisical under the identity
   */
  readonly allowedPrincipalArns: pulumi.Output<string[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * The endpoint URL for the AWS STS API. This value should be adjusted based on the AWS region you are operating in (e.g.
   * `https://sts.us-east-1.amazonaws.com/`); refer to the list of regional STS endpoints
   * [here](https://docs.aws.amazon.com/general/latest/gr/sts.html).
   */
  readonly stsEndpoint: pulumi.Output<string>;
  /**
   * Create a IdentityAwsAuth resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityAwsAuthArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityAwsAuth resources.
 */
export interface IdentityAwsAuthState {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityAwsAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * List of trusted AWS account IDs that are allowed to authenticate with Infisical.
   */
  allowedAccountIds?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted IAM principal ARNs that are allowed to authenticate with Infisical. The values should take one of three
   * forms: `arn:aws:iam::123456789012:user/MyUserName`, `arn:aws:iam::123456789012:role/MyRoleName`, or
   * `arn:aws:iam::123456789012:*`. Using a wildcard in this case allows any IAM principal in the account `123456789012` to
   * authenticate with Infisical under the identity
   */
  allowedPrincipalArns?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId?: pulumi.Input<string>;
  /**
   * The endpoint URL for the AWS STS API. This value should be adjusted based on the AWS region you are operating in (e.g.
   * `https://sts.us-east-1.amazonaws.com/`); refer to the list of regional STS endpoints
   * [here](https://docs.aws.amazon.com/general/latest/gr/sts.html).
   */
  stsEndpoint?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IdentityAwsAuth resource.
 */
export interface IdentityAwsAuthArgs {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityAwsAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * List of trusted AWS account IDs that are allowed to authenticate with Infisical.
   */
  allowedAccountIds?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted IAM principal ARNs that are allowed to authenticate with Infisical. The values should take one of three
   * forms: `arn:aws:iam::123456789012:user/MyUserName`, `arn:aws:iam::123456789012:role/MyRoleName`, or
   * `arn:aws:iam::123456789012:*`. Using a wildcard in this case allows any IAM principal in the account `123456789012` to
   * authenticate with Infisical under the identity
   */
  allowedPrincipalArns?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId: pulumi.Input<string>;
  /**
   * The endpoint URL for the AWS STS API. This value should be adjusted based on the AWS region you are operating in (e.g.
   * `https://sts.us-east-1.amazonaws.com/`); refer to the list of regional STS endpoints
   * [here](https://docs.aws.amazon.com/general/latest/gr/sts.html).
   */
  stsEndpoint?: pulumi.Input<string>;
}
