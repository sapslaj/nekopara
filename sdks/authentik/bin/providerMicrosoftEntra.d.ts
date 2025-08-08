import * as pulumi from "@pulumi/pulumi";
export declare class ProviderMicrosoftEntra extends pulumi.CustomResource {
    /**
     * Get an existing ProviderMicrosoftEntra resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ProviderMicrosoftEntraState, opts?: pulumi.CustomResourceOptions): ProviderMicrosoftEntra;
    /**
     * Returns true if the given object is an instance of ProviderMicrosoftEntra.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is ProviderMicrosoftEntra;
    readonly clientId: pulumi.Output<string>;
    readonly clientSecret: pulumi.Output<string>;
    /**
     * Defaults to `false`.
     */
    readonly dryRun: pulumi.Output<boolean | undefined>;
    readonly excludeUsersServiceAccount: pulumi.Output<boolean | undefined>;
    readonly filterGroup: pulumi.Output<string | undefined>;
    /**
     * Allowed values: - `delete` - `do_nothing` Defaults to `delete`.
     */
    readonly groupDeleteAction: pulumi.Output<string | undefined>;
    readonly name: pulumi.Output<string>;
    readonly propertyMappings: pulumi.Output<string[] | undefined>;
    readonly propertyMappingsGroups: pulumi.Output<string[] | undefined>;
    readonly providerMicrosoftEntraId: pulumi.Output<string>;
    readonly tenantId: pulumi.Output<string>;
    /**
     * Allowed values: - `delete` - `do_nothing` Defaults to `delete`.
     */
    readonly userDeleteAction: pulumi.Output<string | undefined>;
    /**
     * Create a ProviderMicrosoftEntra resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ProviderMicrosoftEntraArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProviderMicrosoftEntra resources.
 */
export interface ProviderMicrosoftEntraState {
    clientId?: pulumi.Input<string>;
    clientSecret?: pulumi.Input<string>;
    /**
     * Defaults to `false`.
     */
    dryRun?: pulumi.Input<boolean>;
    excludeUsersServiceAccount?: pulumi.Input<boolean>;
    filterGroup?: pulumi.Input<string>;
    /**
     * Allowed values: - `delete` - `do_nothing` Defaults to `delete`.
     */
    groupDeleteAction?: pulumi.Input<string>;
    name?: pulumi.Input<string>;
    propertyMappings?: pulumi.Input<pulumi.Input<string>[]>;
    propertyMappingsGroups?: pulumi.Input<pulumi.Input<string>[]>;
    providerMicrosoftEntraId?: pulumi.Input<string>;
    tenantId?: pulumi.Input<string>;
    /**
     * Allowed values: - `delete` - `do_nothing` Defaults to `delete`.
     */
    userDeleteAction?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ProviderMicrosoftEntra resource.
 */
export interface ProviderMicrosoftEntraArgs {
    clientId: pulumi.Input<string>;
    clientSecret: pulumi.Input<string>;
    /**
     * Defaults to `false`.
     */
    dryRun?: pulumi.Input<boolean>;
    excludeUsersServiceAccount?: pulumi.Input<boolean>;
    filterGroup?: pulumi.Input<string>;
    /**
     * Allowed values: - `delete` - `do_nothing` Defaults to `delete`.
     */
    groupDeleteAction?: pulumi.Input<string>;
    name?: pulumi.Input<string>;
    propertyMappings?: pulumi.Input<pulumi.Input<string>[]>;
    propertyMappingsGroups?: pulumi.Input<pulumi.Input<string>[]>;
    providerMicrosoftEntraId?: pulumi.Input<string>;
    tenantId: pulumi.Input<string>;
    /**
     * Allowed values: - `delete` - `do_nothing` Defaults to `delete`.
     */
    userDeleteAction?: pulumi.Input<string>;
}
