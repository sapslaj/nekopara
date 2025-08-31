import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class IdentityKubernetesAuth extends pulumi.CustomResource {
  /**
   * Get an existing IdentityKubernetesAuth resource's state with the given name, ID, and optional extra
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
    state?: IdentityKubernetesAuthState,
    opts?: pulumi.CustomResourceOptions,
  ): IdentityKubernetesAuth;
  /**
   * Returns true if the given object is an instance of IdentityKubernetesAuth.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is IdentityKubernetesAuth;
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
  readonly accessTokenTrustedIps: pulumi.Output<outputs.IdentityKubernetesAuthAccessTokenTrustedIp[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  readonly accessTokenTtl: pulumi.Output<number>;
  /**
   * An optional audience claim that the service account JWT token must have to authenticate with Infisical.
   */
  readonly allowedAudience: pulumi.Output<string>;
  /**
   * List of trusted namespaces that service accounts must belong to authenticate with Infisical.
   */
  readonly allowedNamespaces: pulumi.Output<string[]>;
  /**
   * List of trusted service account names that are allowed to authenticate with Infisical.
   */
  readonly allowedServiceAccountNames: pulumi.Output<string[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  readonly identityId: pulumi.Output<string>;
  /**
   * The PEM-encoded CA cert for the Kubernetes API server. This is used by the TLS client for secure communication with the
   * Kubernetes API server.
   */
  readonly kubernetesCaCertificate: pulumi.Output<string>;
  /**
   * The host string, host:port pair, or URL to the base of the Kubernetes API server. This can usually be obtained by
   * running `kubectl cluster-info`.
   */
  readonly kubernetesHost: pulumi.Output<string>;
  /**
   * A long-lived service account JWT token for Infisical to access the [TokenReview
   * API](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/token-review-v1/) to validate other
   * service account JWT tokens submitted by applications/pods. This is the JWT token obtained from step 1.5.
   */
  readonly tokenReviewerJwt: pulumi.Output<string>;
  /**
   * Create a IdentityKubernetesAuth resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityKubernetesAuthArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering IdentityKubernetesAuth resources.
 */
export interface IdentityKubernetesAuthState {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityKubernetesAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * An optional audience claim that the service account JWT token must have to authenticate with Infisical.
   */
  allowedAudience?: pulumi.Input<string>;
  /**
   * List of trusted namespaces that service accounts must belong to authenticate with Infisical.
   */
  allowedNamespaces?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted service account names that are allowed to authenticate with Infisical.
   */
  allowedServiceAccountNames?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId?: pulumi.Input<string>;
  /**
   * The PEM-encoded CA cert for the Kubernetes API server. This is used by the TLS client for secure communication with the
   * Kubernetes API server.
   */
  kubernetesCaCertificate?: pulumi.Input<string>;
  /**
   * The host string, host:port pair, or URL to the base of the Kubernetes API server. This can usually be obtained by
   * running `kubectl cluster-info`.
   */
  kubernetesHost?: pulumi.Input<string>;
  /**
   * A long-lived service account JWT token for Infisical to access the [TokenReview
   * API](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/token-review-v1/) to validate other
   * service account JWT tokens submitted by applications/pods. This is the JWT token obtained from step 1.5.
   */
  tokenReviewerJwt?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a IdentityKubernetesAuth resource.
 */
export interface IdentityKubernetesAuthArgs {
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
  accessTokenTrustedIps?: pulumi.Input<pulumi.Input<inputs.IdentityKubernetesAuthAccessTokenTrustedIp>[]>;
  /**
   * The lifetime for an access token in seconds. This value will be referenced at renewal time. Default: 2592000
   */
  accessTokenTtl?: pulumi.Input<number>;
  /**
   * An optional audience claim that the service account JWT token must have to authenticate with Infisical.
   */
  allowedAudience?: pulumi.Input<string>;
  /**
   * List of trusted namespaces that service accounts must belong to authenticate with Infisical.
   */
  allowedNamespaces?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * List of trusted service account names that are allowed to authenticate with Infisical.
   */
  allowedServiceAccountNames?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The ID of the identity to attach the configuration onto.
   */
  identityId: pulumi.Input<string>;
  /**
   * The PEM-encoded CA cert for the Kubernetes API server. This is used by the TLS client for secure communication with the
   * Kubernetes API server.
   */
  kubernetesCaCertificate?: pulumi.Input<string>;
  /**
   * The host string, host:port pair, or URL to the base of the Kubernetes API server. This can usually be obtained by
   * running `kubectl cluster-info`.
   */
  kubernetesHost: pulumi.Input<string>;
  /**
   * A long-lived service account JWT token for Infisical to access the [TokenReview
   * API](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/token-review-v1/) to validate other
   * service account JWT tokens submitted by applications/pods. This is the JWT token obtained from step 1.5.
   */
  tokenReviewerJwt: pulumi.Input<string>;
}
