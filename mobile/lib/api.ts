import {ConfigData} from "@/models/ConfigData";
import {AxiosDeviceResponse, EmailConfig, GatewayConfig} from "@/store/store";
import {Interaction} from "@/models/Interaction";
import {Message} from "@/models/Messages";
import {createGatewayFetchClient, normalizeGatewayBaseURL} from "@/lib/openapi/client";

export class ApiRequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiRequestError";
        this.status = status;
    }
}

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
        baseURL: normalizeGatewayBaseURL(gateway.baseURL),
        username: gateway.username ?? "",
        password: gateway.password ?? "",
        label: gateway.label
    };
};

const statusFromResponse = (response: Response | undefined) => response?.status;

export const fetchAPIConfig = async (gatewayInput: GatewayInput) => {
    const gateway = resolveGateway(gatewayInput);

    try {
        const client = createGatewayFetchClient(gateway);
        const {data, error, response} = await client.GET("/api/server");
        if (error || !data) {
            throw new ApiRequestError("API config could not be loaded", statusFromResponse(response));
        }
        return data as ConfigData;
    } catch (error) {
        if (error instanceof ApiRequestError) {
            throw error;
        }
        throw new ApiRequestError("API config could not be loaded");
    }
}

export const verifyBasicLogin = async (gatewayInput: GatewayInput) => {
    const gateway = resolveGateway(gatewayInput);

    try {
        const client = createGatewayFetchClient(gateway, {withoutAuth: true});
        const {error, response} = await client.POST("/login", {
            body: {
                username: gateway.username ?? "",
                password: gateway.password ?? ""
            }
        });
        if (error) {
            throw new ApiRequestError("Gateway login failed", statusFromResponse(response));
        }
    } catch (error) {
        if (error instanceof ApiRequestError) {
            throw error;
        }
        throw new ApiRequestError("Gateway login failed");
    }
}


export const fetchAPIAll = async (gatewayInput: GatewayInput): Promise<AxiosDeviceResponse>=> {
    const gateway = resolveGateway(gatewayInput);
    try {
        const client = createGatewayFetchClient(gateway);
        const {data, error, response} = await client.GET("/api/all");
        if (error || !data) {
            throw new ApiRequestError("Device data could not be loaded", statusFromResponse(response));
        }
        return data as AxiosDeviceResponse;
    } catch (error) {
        if (error instanceof ApiRequestError) {
            throw error;
        }
        throw new Error("Device data could not be loaded");
    }
}


export const saveEmailSettings = async (gatewayInput: GatewayInput, emailConfig: EmailConfig) =>{
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {error, response} = await client.PUT("/email/settings", {
        body: emailConfig
    });
    if (error) {
        throw new ApiRequestError("Email settings could not be saved", statusFromResponse(response));
    }
}

export const sendDeviceAction = async (gatewayInput: GatewayInput, payload: unknown) => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {error, response} = await client.POST("/action", {
        body: payload
    });
    if (error) {
        throw new ApiRequestError("Action could not be sent", statusFromResponse(response));
    }
};

export const fetchInteractions = async (gatewayInput: GatewayInput): Promise<Interaction[]> => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {data, error, response} = await client.GET("/interaction");
    if (error || !data) {
        throw new ApiRequestError("Interactions could not be loaded", statusFromResponse(response));
    }
    return data as Interaction[];
};

export const fetchInteractionById = async (gatewayInput: GatewayInput, interactionId: string): Promise<Interaction> => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {data, error, response} = await client.GET("/interaction/{id}", {
        params: {
            path: {
                id: interactionId
            }
        }
    });
    if (error || !data) {
        throw new ApiRequestError("Interaction could not be loaded", statusFromResponse(response));
    }
    return data as Interaction;
};

export const triggerInteraction = async (gatewayInput: GatewayInput, interactionId: string) => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {error, response} = await client.POST("/interaction/{id}/trigger", {
        params: {
            path: {
                id: interactionId
            }
        }
    });
    if (error) {
        throw new ApiRequestError("Interaction could not be triggered", statusFromResponse(response));
    }
};

export const fetchMessageById = async (gatewayInput: GatewayInput, messageId: string): Promise<Message> => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {data, error, response} = await client.GET("/message/{message_id}", {
        params: {
            path: {
                message_id: messageId
            }
        }
    });
    if (error || !data) {
        throw new ApiRequestError("Message could not be loaded", statusFromResponse(response));
    }
    return data as Message;
};

export const fetchMessages = async (gatewayInput: GatewayInput): Promise<Message[]> => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {data, error, response} = await client.GET("/message");
    if (error || !data) {
        throw new ApiRequestError("Messages could not be loaded", statusFromResponse(response));
    }
    return data as Message[];
};

export const markMessageAsRead = async (gatewayInput: GatewayInput, messageId: string) => {
    const gateway = resolveGateway(gatewayInput);
    const client = createGatewayFetchClient(gateway);
    const {error, response} = await client.PUT("/message/{message_id}", {
        params: {
            path: {
                message_id: messageId
            }
        },
        body: {
            read: true
        }
    });
    if (error) {
        throw new ApiRequestError("Message state could not be updated", statusFromResponse(response));
    }
};
