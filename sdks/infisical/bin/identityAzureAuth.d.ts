import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IdentityAzureAuth extends pulumi.CustomResource {
  /**
   * Get an existing IdentityAzureAuth resource's state with the given name, ID, and optional extra
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
    state?: IdentityAzureAuthState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityAzureAuth;
  /**
   * Returns true if the given object is an instance of IdentityAzureAuth.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityAzureAuth;
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
  readonly accessTokenTrustedIps: pulumi.Output<outputs.IdentityAzureAuthAccessTokenTrustedIp[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenTtl: pulumi.Output<number>;
  /**
   * List of Azure AD service principal IDs that are allowed to authenticate with Infisical
   */
  readonly allowedServicePrincipalIds: pulumi.Output<string[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * The resource URL for the application registered in Azure AD. The value is expected to match the `aud` claim of the
   * access token JWT later used in the login operation against Infisical. See the
   * [resource](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token#get-a-token-using-http)
   * parameter for how the audience is set when requesting a JWT access token from the Azure Instance Metadata Service (IMDS)
   * endpoint. In most cases, this value should be `https://management.azure.com/` which is the default
   */
  readonly resourceUrl: pulumi.Output<string>;
  /**
   * The [tenant ID](https://learn.microsoft.com/en-us/entra/fundamentals/how-to-find-tenant) for the Azure AD organization.
   */
  readonly tenantId: pulumi.Output<string>;
  /**
   * Create a IdentityAzureAuth resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityAzureAuthArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityAzureAuth resources.
 */
export interface IdentityAzureAuthState {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityAzureAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * List of Azure AD service principal IDs that are allowed to authenticate with Infisical
   */
  allowedServicePrincipalIds?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId?: pulumi.Input<string>;
  /**
   * The resource URL for the application registered in Azure AD. The value is expected to match the `aud` claim of the
   * access token JWT later used in the login operation against Infisical. See the
   * [resource](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token#get-a-token-using-http)
   * parameter for how the audience is set when requesting a JWT access token from the Azure Instance Metadata Service (IMDS)
   * endpoint. In most cases, this value should be `https://management.azure.com/` which is the default
   */
  resourceUrl?: pulumi.Input<string>;
  /**
   * The [tenant ID](https://learn.microsoft.com/en-us/entra/fundamentals/how-to-find-tenant) for the Azure AD organization.
   */
  tenantId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IdentityAzureAuth resource.
 */
export interface IdentityAzureAuthArgs {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityAzureAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * List of Azure AD service principal IDs that are allowed to authenticate with Infisical
   */
  allowedServicePrincipalIds?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId: pulumi.Input<string>;
  /**
   * The resource URL for the application registered in Azure AD. The value is expected to match the `aud` claim of the
   * access token JWT later used in the login operation against Infisical. See the
   * [resource](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token#get-a-token-using-http)
   * parameter for how the audience is set when requesting a JWT access token from the Azure Instance Metadata Service (IMDS)
   * endpoint. In most cases, this value should be `https://management.azure.com/` which is the default
   */
  resourceUrl?: pulumi.Input<string>;
  /**
   * The [tenant ID](https://learn.microsoft.com/en-us/entra/fundamentals/how-to-find-tenant) for the Azure AD organization.
   */
  tenantId: pulumi.Input<string>;
}
