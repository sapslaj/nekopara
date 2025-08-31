import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
/**
 * The provider type for the infisical package. By default, resources use package-wide configuration
 * settings, however an explicit `Provider` instance may be created and passed during resource
 * construction to achieve fine-grained programmatic control over provider settings. See the
 * [documentation](https://www.pulumi.com/docs/reference/programming-model/#providers) for more information.
 */
export declare class Provider extends pulumi.ProviderResource {
  /**
   * Returns true if the given object is an instance of Provider.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is Provider;
  /**
   * (DEPRECATED, Use the `auth` attribute), Machine identity client ID. Used to fetch/modify secrets for a given project.
   */
  readonly clientId: pulumi.Output<string | undefined>;
  /**
   * (DEPRECATED, use `auth` attribute), Machine identity client secret. Used to fetch/modify secrets for a given project
   */
  readonly clientSecret: pulumi.Output<string | undefined>;
  /**
   * Used to point the client to fetch secrets from your self hosted instance of Infisical. If not host is provided,
   * https://app.infisical.com is the default host. This attribute can also be set using the `INFISICAL_HOST` environment
   * variable
   */
  readonly host: pulumi.Output<string | undefined>;
  /**
   * (DEPRECATED, Use machine identity auth), Used to fetch/modify secrets for a given project
   */
  readonly serviceToken: pulumi.Output<string | undefined>;
  /**
   * Create a Provider resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args?: ProviderArgs, opts?: pulumi.ResourceOptions);
  /**
   * This function returns a Terraform config object with terraform-namecased keys,to be used with the Terraform Module Provider.
   */
  terraformConfig(): pulumi.Output<{
    [key: string]: any;
  }>;
}
/**
 * The set of arguments for constructing a Provider resource.
 */
export interface ProviderArgs {
  /**
   * The configuration values for authentication
   */
  auth?: pulumi.Input<inputs.ProviderAuth>;
  /**
   * (DEPRECATED, Use the `auth` attribute), Machine identity client ID. Used to fetch/modify secrets for a given project.
   */
  clientId?: pulumi.Input<string>;
  /**
   * (DEPRECATED, use `auth` attribute), Machine identity client secret. Used to fetch/modify secrets for a given project
   */
  clientSecret?: pulumi.Input<string>;
  /**
   * Used to point the client to fetch secrets from your self hosted instance of Infisical. If not host is provided,
   * https://app.infisical.com is the default host. This attribute can also be set using the `INFISICAL_HOST` environment
   * variable
   */
  host?: pulumi.Input<string>;
  /**
   * (DEPRECATED, Use machine identity auth), Used to fetch/modify secrets for a given project
   */
  serviceToken?: pulumi.Input<string>;
}
export declare namespace Provider {
  /**
   * The results of the Provider.terraformConfig method.
   */
  interface TerraformConfigResult {
    readonly result: {
      [key: string]: any;
    };
  }
}
