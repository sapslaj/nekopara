import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Identity extends pulumi.CustomResource {
  /**
   * Get an existing Identity resource's state with the given name, ID, and optional extra
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
    state?: IdentityState,
    opts?: pulumi.CustomResourceOptions,
  ): Identity;
  /**
   * Returns true if the given object is an instance of Identity.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is Identity;
  /**
   * The authentication types of the identity
   */
  readonly authModes: pulumi.Output<string[]>;
  /**
   * Whether the identity has delete protection, defaults to false
   */
  readonly hasDeleteProtection: pulumi.Output<boolean>;
  /**
   * The metadata associated with this identity
   */
  readonly metadatas: pulumi.Output<outputs.IdentityMetadata[] | undefined>;
  /**
   * The name for the identity
   */
  readonly name: pulumi.Output<string>;
  /**
   * The ID of the organization for the identity
   */
  readonly orgId: pulumi.Output<string>;
  /**
   * The role for the identity. Available default role options are 'admin', 'member', and 'no-access'. If you've created
   * custom roles, you can use their slugs as well.
   */
  readonly role: pulumi.Output<string>;
  /**
   * Create a Identity resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: IdentityArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Identity resources.
 */
export interface IdentityState {
  /**
   * The authentication types of the identity
   */
  authModes?: pulumi.Input<pulumi.Input<string>[]>;
  /**
   * Whether the identity has delete protection, defaults to false
   */
  hasDeleteProtection?: pulumi.Input<boolean>;
  /**
   * The metadata associated with this identity
   */
  metadatas?: pulumi.Input<pulumi.Input<inputs.IdentityMetadata>[]>;
  /**
   * The name for the identity
   */
  name?: pulumi.Input<string>;
  /**
   * The ID of the organization for the identity
   */
  orgId?: pulumi.Input<string>;
  /**
   * The role for the identity. Available default role options are 'admin', 'member', and 'no-access'. If you've created
   * custom roles, you can use their slugs as well.
   */
  role?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Identity resource.
 */
export interface IdentityArgs {
  /**
   * Whether the identity has delete protection, defaults to false
   */
  hasDeleteProtection?: pulumi.Input<boolean>;
  /**
   * The metadata associated with this identity
   */
  metadatas?: pulumi.Input<pulumi.Input<inputs.IdentityMetadata>[]>;
  /**
   * The name for the identity
   */
  name?: pulumi.Input<string>;
  /**
   * The ID of the organization for the identity
   */
  orgId: pulumi.Input<string>;
  /**
   * The role for the identity. Available default role options are 'admin', 'member', and 'no-access'. If you've created
   * custom roles, you can use their slugs as well.
   */
  role: pulumi.Input<string>;
}
