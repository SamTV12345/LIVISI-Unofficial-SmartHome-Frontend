import {AuthMode, ConfigData} from "@/models/ConfigData";

export const resolveAuthMode = (config: ConfigData): AuthMode => {
    if (config.authMode) {
        return config.authMode;
    }
    if (config.oidcConfigured) {
        return "oidc";
    }
    if (config.basicAuth) {
        return "basic";
    }
    return "none";
};
