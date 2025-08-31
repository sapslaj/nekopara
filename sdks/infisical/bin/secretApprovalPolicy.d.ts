import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class SecretApprovalPolicy extends pulumi.CustomResource {
  /**
   * Get an existing SecretApprovalPolicy resource's state with the given name, ID, and optional extra
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
    state?: SecretApprovalPolicyState,
    opts?: pulumi.CustomResourceOptions,
  ): SecretApprovalPolicy;
  /**
   * Returns true if the given object is an instance of SecretApprovalPolicy.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is SecretApprovalPolicy;
  /**
   * Whether to allow the approvers to approve their own changes
   */
  readonly allowSelfApproval: pulumi.Output<boolean>;
  /**
   * The required approvers
   */
  readonly approvers: pulumi.Output<outputs.SecretApprovalPolicyApprover[]>;
  /**
   * The enforcement level of the policy. This can either be hard or soft
   */
  readonly enforcementLevel: pulumi.Output<string>;
  /**
   * (DEPRECATED, Use environment_slugs instead) The environment to apply the secret approval policy to
   */
  readonly environmentSlug: pulumi.Output<string | undefined>;
  /**
   * The environments to apply the secret approval policy to
   */
  readonly environmentSlugs: pulumi.Output<string[] | undefined>;
  /**
   * The name of the secret approval policy
   */
  readonly name: pulumi.Output<string>;
  /**
   * The ID of the project to add the secret approval policy
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The number of required approvers
   */
  readonly requiredApprovals: pulumi.Output<number>;
  /**
   * The secret path to apply the secret approval policy to
   */
  readonly secretPath: pulumi.Output<string>;
  /**
   * Create a SecretApprovalPolicy resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: SecretApprovalPolicyArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SecretApprovalPolicy resources.
 */
export interface SecretApprovalPolicyState {
  /**
   * Whether to allow the approvers to approve their own changes
   */
  allowSelfApproval?: pulumi.Input<boolean>;
  /**
   * The required approvers
   */
  approvers?: pulumi.Input<pulumi.Input<inputs.SecretApprovalPolicyApprover>[]>;
  /**
   * The enforcement level of the policy. This can either be hard or soft
   */
  enforcementLevel?: pulumi.Input<string>;
  /**
   * (DEPRECATED, Use environment_slugs instead) The environment to apply the secret approval policy to
   */
  environmentSlug?: pulumi.Input<string>;
  /**
   * The environments to apply the secret approval policy to
   */
  environmentSlugs?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The name of the secret approval policy
   */
  name?: pulumi.Input<string>;
  /**
   * The ID of the project to add the secret approval policy
   */
  projectId?: pulumi.Input<string>;
  /**
   * The number of required approvers
   */
  requiredApprovals?: pulumi.Input<number>;
  /**
   * The secret path to apply the secret approval policy to
   */
  secretPath?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a SecretApprovalPolicy resource.
 */
export interface SecretApprovalPolicyArgs {
  /**
   * Whether to allow the approvers to approve their own changes
   */
  allowSelfApproval?: pulumi.Input<boolean>;
  /**
   * The required approvers
   */
  approvers: pulumi.Input<pulumi.Input<inputs.SecretApprovalPolicyApprover>[]>;
  /**
   * The enforcement level of the policy. This can either be hard or soft
   */
  enforcementLevel?: pulumi.Input<string>;
  /**
   * (DEPRECATED, Use environment_slugs instead) The environment to apply the secret approval policy to
   */
  environmentSlug?: pulumi.Input<string>;
  /**
   * The environments to apply the secret approval policy to
   */
  environmentSlugs?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * The name of the secret approval policy
   */
  name?: pulumi.Input<string>;
  /**
   * The ID of the project to add the secret approval policy
   */
  projectId: pulumi.Input<string>;
  /**
   * The number of required approvers
   */
  requiredApprovals: pulumi.Input<number>;
  /**
   * The secret path to apply the secret approval policy to
   */
  secretPath: pulumi.Input<string>;
}
