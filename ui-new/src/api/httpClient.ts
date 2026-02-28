import {getAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

const REQUEST_TIMEOUT_MS = 15_000;

export class HttpRequestError extends Error {
    status: number;
    responseText: string;

    constructor(status: number, responseText: string) {
        super(`HTTP request failed with status ${status}`);
        this.status = status;
        this.responseText = responseText;
    }
}

type PostJsonOptions = {
    timeoutMs?: number;
};

export const postJson = async <TResponse>(path: string, body: unknown, options?: PostJsonOptions): Promise<TResponse> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, options?.timeoutMs ?? REQUEST_TIMEOUT_MS);

    try {
        const headers = new Headers({
            "Content-Type": "application/json"
        });
        const authorization = getAuthorizationHeader();
        if (authorization) {
            headers.set("Authorization", authorization);
        }

        const response = await fetch(path, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            credentials: "same-origin",
            signal: controller.signal
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new HttpRequestError(response.status, responseText);
        }

        if (responseText.length === 0) {
            return undefined as TResponse;
        }

        return JSON.parse(responseText) as TResponse;
    } finally {
        clearTimeout(timeout);
    }
};
