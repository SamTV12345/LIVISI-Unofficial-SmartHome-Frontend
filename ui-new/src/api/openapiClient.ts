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
