import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IdentityGcpAuth extends pulumi.CustomResource {
  /**
   * Get an existing IdentityGcpAuth resource's state with the given name, ID, and optional extra
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
    state?: IdentityGcpAuthState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityGcpAuth;
  /**
   * Returns true if the given object is an instance of IdentityGcpAuth.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityGcpAuth;
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
  readonly accessTokenTrustedIps: pulumi.Output<outputs.IdentityGcpAuthAccessTokenTrustedIp[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenTtl: pulumi.Output<number>;
  /**
   * List of trusted GCP projects that the GCE instance must belong to authenticate with Infisical. Note that this validation
   * property will only work for GCE instances
   */
  readonly allowedProjects: pulumi.Output<string[]>;
  /**
   * List of trusted service account emails corresponding to the GCE resource(s) allowed to authenticate with Infisical; this
   * could be something like `test@project.iam.gserviceaccount.com`, `12345-compute@developer.gserviceaccount.com`, etc.
   */
  readonly allowedServiceAccountEmails: pulumi.Output<string[]>;
  /**
   * List of trusted zones that the GCE instances must belong to authenticate with Infisical; this should be the
   * fully-qualified zone name in the format `<region>-<zone>`like `us-central1-a`, `us-west1-b`, etc. Note that this
   * validation property will only work for GCE instances.
   */
  readonly allowedZones: pulumi.Output<string[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * The Type of GCP Auth Method to use: Options are gce, iam. Default:gce
   */
  readonly type: pulumi.Output<string>;
  /**
   * Create a IdentityGcpAuth resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityGcpAuthArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityGcpAuth resources.
 */
export interface IdentityGcpAuthState {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityGcpAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * List of trusted GCP projects that the GCE instance must belong to authenticate with Infisical. Note that this validation
   * property will only work for GCE instances
   */
  allowedProjects?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted service account emails corresponding to the GCE resource(s) allowed to authenticate with Infisical; this
   * could be something like `test@project.iam.gserviceaccount.com`, `12345-compute@developer.gserviceaccount.com`, etc.
   */
  allowedServiceAccountEmails?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted zones that the GCE instances must belong to authenticate with Infisical; this should be the
   * fully-qualified zone name in the format `<region>-<zone>`like `us-central1-a`, `us-west1-b`, etc. Note that this
   * validation property will only work for GCE instances.
   */
  allowedZones?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId?: pulumi.Input<string>;
  /**
   * The Type of GCP Auth Method to use: Options are gce, iam. Default:gce
   */
  type?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IdentityGcpAuth resource.
 */
export interface IdentityGcpAuthArgs {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityGcpAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * List of trusted GCP projects that the GCE instance must belong to authenticate with Infisical. Note that this validation
   * property will only work for GCE instances
   */
  allowedProjects?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted service account emails corresponding to the GCE resource(s) allowed to authenticate with Infisical; this
   * could be something like `test@project.iam.gserviceaccount.com`, `12345-compute@developer.gserviceaccount.com`, etc.
   */
  allowedServiceAccountEmails?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted zones that the GCE instances must belong to authenticate with Infisical; this should be the
   * fully-qualified zone name in the format `<region>-<zone>`like `us-central1-a`, `us-west1-b`, etc. Note that this
   * validation property will only work for GCE instances.
   */
  allowedZones?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId: pulumi.Input<string>;
  /**
   * The Type of GCP Auth Method to use: Options are gce, iam. Default:gce
   */
  type?: pulumi.Input<string>;
}
