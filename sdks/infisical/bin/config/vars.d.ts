import * as outputs from "../types/output";
/**
 * The configuration values for authentication
 */
export declare const auth: outputs.config.Auth | undefined;
/**
 * (DEPRECATED, Use the `auth` attribute), Machine identity client ID. Used to fetch/modify secrets for a given project.
 */
export declare const clientId: string | undefined;
/**
 * (DEPRECATED, use `auth` attribute), Machine identity client secret. Used to fetch/modify secrets for a given project
 */
export declare const clientSecret: string | undefined;
/**
 * Used to point the client to fetch secrets from your self hosted instance of Infisical. If not host is provided,
 * https://app.infisical.com is the default host. This attribute can also be set using the `INFISICAL_HOST` environment
 * variable
 */
export declare const host: string | undefined;
/**
 * (DEPRECATED, Use machine identity auth), Used to fetch/modify secrets for a given project
 */
export declare const serviceToken: string | undefined;
