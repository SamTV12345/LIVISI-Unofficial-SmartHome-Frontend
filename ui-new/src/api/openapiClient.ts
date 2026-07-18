import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type {paths} from "@/src/api/schema";
import {getAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

export const openapiFetchClient = createFetchClient<paths>({
    baseUrl: "",
    credentials: "same-origin"
});

openapiFetchClient.use({
    onRequest({request}) {
        const authorization = getAuthorizationHeader();
        if (authorization && !request.headers.has("Authorization")) {
            request.headers.set("Authorization", authorization);
        }
        return request;
    }
});

export const apiQueryClient = createClient(openapiFetchClient);

export class ApiError extends Error {
    constructor(readonly status: number, readonly responseText: string) {
        super(`HTTP request failed with status ${status}`);
    }
}

// ponytail: openapi-fetch never throws on HTTP errors; this restores throw-on-error
// (plus the old 15s timeout) for the many /action call sites with try/catch UIs.
export const postAction = async (body: unknown): Promise<unknown> => {
    const {data, error, response} = await openapiFetchClient.POST("/action", {
        body,
        signal: AbortSignal.timeout(15_000)
    });
    if (error !== undefined || !response.ok) {
        throw new ApiError(response.status, typeof error === "string" ? error : JSON.stringify(error ?? ""));
    }
    return data;
};
