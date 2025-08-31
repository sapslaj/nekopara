import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ProjectTemplate extends pulumi.CustomResource {
  /**
   * Get an existing ProjectTemplate resource's state with the given name, ID, and optional extra
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
    state?: ProjectTemplateState,
    opts?: pulumi.CustomResourceOptions,
  ): ProjectTemplate;
  /**
   * Returns true if the given object is an instance of ProjectTemplate.  This is designed to work even
   * when multiple copies of the Pulumi SDK have been loaded into the same process.
   */
  static isInstance(obj: any): obj is ProjectTemplate;
  /**
   * The description of the project template
   */
  readonly description: pulumi.Output<string | undefined>;
  /**
   * The environments for the project template
   */
  readonly environments: pulumi.Output<outputs.ProjectTemplateEnvironment[] | undefined>;
  /**
   * The name of the project template
   */
  readonly name: pulumi.Output<string>;
  /**
   * The roles for the project template
   */
  readonly roles: pulumi.Output<outputs.ProjectTemplateRole[]>;
  /**
   * The type of the project template. Refer to the documentation here
   * https://infisical.com/docs/api-reference/endpoints/project-templates/create#body-type for the available options
   */
  readonly type: pulumi.Output<string>;
  /**
   * Create a ProjectTemplate resource with the given unique name, arguments, and options.
   *
   * @param name The _unique_ name of the resource.
   * @param args The arguments to use to populate this resource's properties.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, args: ProjectTemplateArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectTemplate resources.
 */
export interface ProjectTemplateState {
  /**
   * The description of the project template
   */
  description?: pulumi.Input<string>;
  /**
   * The environments for the project template
   */
  environments?: pulumi.Input<pulumi.Input<inputs.ProjectTemplateEnvironment>[]>;
  /**
   * The name of the project template
   */
  name?: pulumi.Input<string>;
  /**
   * The roles for the project template
   */
  roles?: pulumi.Input<pulumi.Input<inputs.ProjectTemplateRole>[]>;
  /**
   * The type of the project template. Refer to the documentation here
   * https://infisical.com/docs/api-reference/endpoints/project-templates/create#body-type for the available options
   */
  type?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ProjectTemplate resource.
 */
export interface ProjectTemplateArgs {
  /**
   * The description of the project template
   */
  description?: pulumi.Input<string>;
  /**
   * The environments for the project template
   */
  environments?: pulumi.Input<pulumi.Input<inputs.ProjectTemplateEnvironment>[]>;
  /**
   * The name of the project template
   */
  name?: pulumi.Input<string>;
  /**
   * The roles for the project template
   */
  roles?: pulumi.Input<pulumi.Input<inputs.ProjectTemplateRole>[]>;
  /**
   * The type of the project template. Refer to the documentation here
   * https://infisical.com/docs/api-reference/endpoints/project-templates/create#body-type for the available options
   */
  type: pulumi.Input<string>;
}
