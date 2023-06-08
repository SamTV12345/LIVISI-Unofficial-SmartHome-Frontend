export interface ConfigModel {
    podindexConfigured: boolean,
    rssFeed: string
    serverUrl: string,
    basicAuth: string,
    oidcConfigured: boolean,
    oidcConfig?: {
        authority: string,
        clientId: string,
        redirectUri: string,
        scope: string,
    }
}
