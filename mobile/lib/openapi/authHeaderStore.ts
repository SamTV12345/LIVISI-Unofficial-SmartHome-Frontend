let authorizationHeader: string | undefined;

export const getAuthorizationHeader = (): string | undefined => {
    return authorizationHeader;
};

export const setAuthorizationHeader = (value: string | undefined) => {
    authorizationHeader = value;
};

export const clearAuthorizationHeader = () => {
    authorizationHeader = undefined;
};
