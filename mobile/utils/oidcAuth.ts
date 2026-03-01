import * as AuthSession from "expo-auth-session";
import {OidcConfig} from "@/models/ConfigData";

const parseScopes = (scope: string): string[] => {
    const scopes = scope
        .split(/\s+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    return scopes.length > 0 ? scopes : ["openid"];
};

export class OidcAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OidcAuthError";
    }
}

export const authenticateWithOidc = async (oidcConfig: OidcConfig): Promise<string> => {
    try {
        const discovery = await AuthSession.fetchDiscoveryAsync(oidcConfig.authority);

        if (!discovery.authorizationEndpoint || !discovery.tokenEndpoint) {
            throw new OidcAuthError("OIDC Discovery ist unvollständig.");
        }

        const authRequest = new AuthSession.AuthRequest({
            clientId: oidcConfig.clientId,
            redirectUri: oidcConfig.redirectUri,
            scopes: parseScopes(oidcConfig.scope),
            responseType: AuthSession.ResponseType.Code,
            usePKCE: true
        });

        await authRequest.makeAuthUrlAsync(discovery);
        const authResult = await authRequest.promptAsync(discovery);

        if (authResult.type === "cancel" || authResult.type === "dismiss") {
            throw new OidcAuthError("OIDC-Anmeldung wurde abgebrochen.");
        }
        if (authResult.type !== "success") {
            throw new OidcAuthError("OIDC-Anmeldung fehlgeschlagen.");
        }

        const authorizationCode = authResult.params?.code;
        if (!authorizationCode) {
            throw new OidcAuthError("OIDC-Antwort enthält keinen Authorization Code.");
        }

        const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
                clientId: oidcConfig.clientId,
                code: authorizationCode,
                redirectUri: oidcConfig.redirectUri,
                extraParams: authRequest.codeVerifier ? {code_verifier: authRequest.codeVerifier} : undefined
            },
            discovery
        );

        if (!tokenResponse.accessToken) {
            throw new OidcAuthError("OIDC Token-Antwort enthält kein Access Token.");
        }

        return tokenResponse.accessToken;
    } catch (error) {
        if (error instanceof OidcAuthError) {
            throw error;
        }

        if (error instanceof Error && error.message.trim().length > 0) {
            throw new OidcAuthError(error.message);
        }

        throw new OidcAuthError("OIDC-Anmeldung fehlgeschlagen.");
    }
};
