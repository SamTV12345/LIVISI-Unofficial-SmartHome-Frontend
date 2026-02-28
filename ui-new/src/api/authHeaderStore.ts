let authorizationHeader: string | undefined;

const readStoredBasicAuth = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("auth") ?? sessionStorage.getItem("auth");
};

export const getAuthorizationHeader = (): string | undefined => {
    if (authorizationHeader) {
        return authorizationHeader;
    }

    const basicAuth = readStoredBasicAuth();
    if (basicAuth) {
        return "Basic " + basicAuth;
    }

    return undefined;
};

export const setAuthorizationHeader = (value: string | undefined) => {
    authorizationHeader = value;
};

export const clearAuthorizationHeader = () => {
    authorizationHeader = undefined;
};
