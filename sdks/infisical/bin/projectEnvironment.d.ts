import * as pulumi from "@pulumi/pulumi";
export declare class ProjectEnvironment extends pulumi.CustomResource {
  /**
   * Get an existing ProjectEnvironment resource's state with the given name, ID, and optional extra
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
    state?: ProjectEnvironmentState,
    opts?: pulumi.CustomResourceOptions,
  ): ProjectEnvironment;
  /**
   * Returns true if the given object is an instance of ProjectEnvironment.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is ProjectEnvironment;
  /**
   * The name of the environment
   */
  readonly name: pulumi.Output<string>;
  /**
   * The position of the environment
   */
  readonly position: pulumi.Output<number>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  readonly projectId: pulumi.Output<string>;
  /**
   * The slug of the environment
   */
  readonly slug: pulumi.Output<string>;
  /**
   * Create a ProjectEnvironment resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectEnvironmentArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectEnvironment resources.
 */
export interface ProjectEnvironmentState {
  /**
   * The name of the environment
   */
  name?: pulumi.Input<string>;
  /**
   * The position of the environment
   */
  position?: pulumi.Input<number>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  projectId?: pulumi.Input<string>;
  /**
   * The slug of the environment
   */
  slug?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ProjectEnvironment resource.
 */
export interface ProjectEnvironmentArgs {
  /**
   * The name of the environment
   */
  name?: pulumi.Input<string>;
  /**
   * The position of the environment
   */
  position?: pulumi.Input<number>;
  /**
   * The Infisical project ID (Required for Machine Identity auth, and service tokens with multiple scopes)
   */
  projectId: pulumi.Input<string>;
  /**
   * The slug of the environment
   */
  slug: pulumi.Input<string>;
}
