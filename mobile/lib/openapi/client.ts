import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import {GatewayConfig} from "@/store/store";
import {paths} from "@/lib/openapi/types";

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

export const normalizeGatewayBaseURL = (baseURL: string): string => {
    return trimTrailingSlash(baseURL);
};

const encodeBasicToken = (username: string, password: string): string | undefined => {
    const credentials = `${username}:${password}`;
    if (typeof globalThis.btoa === "function") {
        return globalThis.btoa(credentials);
    }
    const runtime = globalThis as {
        Buffer?: {from: (value: string, encoding: string) => {toString: (encoding: string) => string}};
    };
    return runtime.Buffer?.from(credentials, "utf-8").toString("base64");
};

const buildAuthorizationHeader = (gateway: GatewayConfig): string | undefined => {
    const username = gateway.username?.trim() ?? "";
    const password = gateway.password ?? "";
    if (!username || !password) {
        return undefined;
    }
    const token = encodeBasicToken(username, password);
    if (!token) {
        return undefined;
    }
    return `Basic ${token}`;
};

type ClientOptions = {
    withoutAuth?: boolean;
};

export const createGatewayFetchClient = (
    gateway: Pick<GatewayConfig, "baseURL" | "username" | "password">,
    options?: ClientOptions
) => {
    const authorization = options?.withoutAuth ? undefined : buildAuthorizationHeader(gateway);
    return createFetchClient<paths>({
        baseUrl: normalizeGatewayBaseURL(gateway.baseURL),
        headers: authorization ? {Authorization: authorization} : undefined
    });
};

export const createGatewayQueryClient = (
    gateway: Pick<GatewayConfig, "baseURL" | "username" | "password">,
    options?: ClientOptions
) => {
    return createClient(createGatewayFetchClient(gateway, options));
};
