import {ConfigData} from "@/models/ConfigData";
import {AxiosDeviceResponse, EmailConfig} from "@/store/store";
import ky from "ky";

const DEFAULT_TIMEOUT_MS = 12_000;

const normalizeBaseURL = (baseURL: string): string => {
    return baseURL.trim().replace(/\/+$/, "");
};

const buildURL = (baseURL: string, path: string): string => {
    return normalizeBaseURL(baseURL) + path;
};

const apiClient = ky.create({
    timeout: DEFAULT_TIMEOUT_MS,
    retry: {
        limit: 1
    }
});

export const fetchAPIConfig = async (baseURL: string) => {
    const endpoint = buildURL(baseURL, "/api/server");

    try {
        return await apiClient.get(endpoint).json<ConfigData>();
    } catch (error) {
        throw new Error("API config could not be loaded");
    }
}


export const fetchAPIAll = async (baseURL: string): Promise<AxiosDeviceResponse>=> {
    const endpoint = buildURL(baseURL, "/api/all");
    try {
        return await apiClient.get(endpoint).json<AxiosDeviceResponse>();
    } catch (error) {
        throw new Error("Device data could not be loaded");
    }
}


export const saveEmailSettings = async (baseURL: string, emailConfig: EmailConfig) =>{
    const endpoint = buildURL(baseURL, "/email/settings");
    await apiClient.put(endpoint, {
       json: emailConfig
    });
}
