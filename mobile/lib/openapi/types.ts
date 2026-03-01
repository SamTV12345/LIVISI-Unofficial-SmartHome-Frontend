import type {paths as GeneratedPaths} from "@/lib/openapi/schema";

type EmptyParams = {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
};

type LoginPath = {
    "/login": {
        parameters: EmptyParams;
        get?: never;
        put?: never;
        post: {
            parameters: EmptyParams;
            requestBody: {
                content: {
                    "application/json": {
                        username: string;
                        password: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: Record<string, unknown>;
                    content: {"application/json": unknown};
                };
                400: {
                    headers: Record<string, unknown>;
                    content: {"application/json": unknown};
                };
                401: {
                    headers: Record<string, unknown>;
                    content: {"application/json": unknown};
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};

type ActionPath = {
    "/action": {
        parameters: EmptyParams;
        get?: never;
        put?: never;
        post: {
            parameters: EmptyParams;
            requestBody: {
                content: {
                    "application/json": unknown;
                };
            };
            responses: {
                200: {
                    headers: Record<string, unknown>;
                    content: {"application/json": unknown};
                };
                204: {
                    headers: Record<string, unknown>;
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};

export type paths = GeneratedPaths & LoginPath & ActionPath;
