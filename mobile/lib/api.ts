import {ConfigData} from "@/models/ConfigData";
import {AxiosDeviceResponse, EmailConfig, GatewayConfig} from "@/store/store";
import {Interaction} from "@/models/Interaction";
import {Message} from "@/models/Messages";
import ky from "ky";

const DEFAULT_TIMEOUT_MS = 12_000;

const normalizeBaseURL = (baseURL: string): string => {
    return baseURL.trim().replace(/\/+$/, "");
};

const buildURL = (baseURL: string, path: string): string => {
    return normalizeBaseURL(baseURL) + path;
};

type GatewayInput = GatewayConfig | string;

const resolveGateway = (gateway: GatewayInput): GatewayConfig => {
    if (typeof gateway === "string") {
        return {
            baseURL: gateway,
            username: "",
            password: ""
        };
    }
    return {
        baseURL: gateway.baseURL,
        username: gateway.username ?? "",
        password: gateway.password ?? "",
        label: gateway.label
    };
};

const basicAuthHeader = (gateway: GatewayConfig): Record<string, string> => {
    if (!gateway.username || !gateway.password) {
        return {};
    }

    const credential = `${gateway.username}:${gateway.password}`;
    const token = typeof globalThis.btoa === "function"
        ? globalThis.btoa(credential)
        : (globalThis as {Buffer?: {from: (value: string, encoding: string) => {toString: (encoding: string) => string}}}).Buffer
            ?.from(credential, "utf-8")
            .toString("base64");

    if (!token) {
        return {};
    }
    return {
        Authorization: `Basic ${token}`
    };
};

const apiClient = ky.create({
    timeout: DEFAULT_TIMEOUT_MS,
    retry: {
        limit: 1
    }
});

export const fetchAPIConfig = async (gatewayInput: GatewayInput) => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, "/api/server");

    try {
        return await apiClient.get(endpoint, {
            headers: basicAuthHeader(gateway)
        }).json<ConfigData>();
    } catch {
        throw new Error("API config could not be loaded");
    }
}


export const fetchAPIAll = async (gatewayInput: GatewayInput): Promise<AxiosDeviceResponse>=> {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, "/api/all");
    try {
        return await apiClient.get(endpoint, {
            headers: basicAuthHeader(gateway)
        }).json<AxiosDeviceResponse>();
    } catch {
        throw new Error("Device data could not be loaded");
    }
}


export const saveEmailSettings = async (gatewayInput: GatewayInput, emailConfig: EmailConfig) =>{
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, "/email/settings");
    await apiClient.put(endpoint, {
       json: emailConfig,
       headers: basicAuthHeader(gateway)
    });
}

export const sendDeviceAction = async (gatewayInput: GatewayInput, payload: unknown) => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, "/action");
    await apiClient.post(endpoint, {
        json: payload,
        headers: basicAuthHeader(gateway)
    });
};

export const fetchInteractions = async (gatewayInput: GatewayInput): Promise<Interaction[]> => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, "/interaction");
    return apiClient.get(endpoint, {
        headers: basicAuthHeader(gateway)
    }).json<Interaction[]>();
};

export const fetchInteractionById = async (gatewayInput: GatewayInput, interactionId: string): Promise<Interaction> => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, `/interaction/${encodeURIComponent(interactionId)}`);
    return apiClient.get(endpoint, {
        headers: basicAuthHeader(gateway)
    }).json<Interaction>();
};

export const triggerInteraction = async (gatewayInput: GatewayInput, interactionId: string) => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, `/interaction/${encodeURIComponent(interactionId)}/trigger`);
    await apiClient.post(endpoint, {
        headers: basicAuthHeader(gateway)
    });
};

export const fetchMessageById = async (gatewayInput: GatewayInput, messageId: string): Promise<Message> => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, `/message/${encodeURIComponent(messageId)}`);
    return apiClient.get(endpoint, {
        headers: basicAuthHeader(gateway)
    }).json<Message>();
};

export const markMessageAsRead = async (gatewayInput: GatewayInput, messageId: string) => {
    const gateway = resolveGateway(gatewayInput);
    const endpoint = buildURL(gateway.baseURL, `/message/${encodeURIComponent(messageId)}`);
    await apiClient.put(endpoint, {
        headers: basicAuthHeader(gateway),
        json: {
            read: true
        }
    });
};
