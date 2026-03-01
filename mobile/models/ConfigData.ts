export type AuthMode = "none" | "basic" | "oidc";

export type OidcConfig = {
    authority: string;
    clientId: string;
    redirectUri: string;
    scope: string;
};

export type ConfigData = {
    authMode?: AuthMode;
    basicAuth: boolean;
    oidcConfig?: OidcConfig | null;
    oidcConfigured: boolean;
};
