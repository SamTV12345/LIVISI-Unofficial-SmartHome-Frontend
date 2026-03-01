export type AuthMode = "none" | "basic" | "oidc";

export interface ConfigModel {
    authMode: AuthMode,
    basicAuth: boolean,
    oidcConfigured: boolean,
    oidcConfig?: {
        authority: string,
        clientId: string,
        redirectUri: string,
        scope: string,
    }
}
