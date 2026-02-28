import axios, {AxiosHeaders} from "axios";

const REQUEST_TIMEOUT_MS = 15_000;
let configured = false;

const readStoredBasicAuth = (): string | null => {
    return localStorage.getItem("auth") ?? sessionStorage.getItem("auth");
};

export const configureHttpClient = () => {
    if (configured) {
        return;
    }

    axios.defaults.timeout = REQUEST_TIMEOUT_MS;
    axios.interceptors.request.use((requestConfig) => {
        const headers = AxiosHeaders.from(requestConfig.headers);
        const alreadyAuthenticated = Boolean(headers.get("Authorization"));

        if (!alreadyAuthenticated) {
            const basicAuth = readStoredBasicAuth();
            if (basicAuth) {
                headers.set("Authorization", "Basic " + basicAuth);
            }
        }
        requestConfig.headers = headers;
        return requestConfig;
    });

    configured = true;
};
