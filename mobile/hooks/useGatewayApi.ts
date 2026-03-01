import {useMemo} from "react";
import {GatewayConfig, useContentModel} from "@/store/store";
import {createGatewayQueryClient} from "@/lib/openapi/client";

type GatewayIdentity = Pick<GatewayConfig, "baseURL" | "username" | "password">;

export const useGatewayApi = () => {
    const gateway = useContentModel((state) => state.gateway);
    const gatewayIdentity = useMemo<GatewayIdentity>(() => ({
        baseURL: gateway?.baseURL ?? "http://127.0.0.1",
        username: gateway?.username ?? "",
        password: gateway?.password ?? ""
    }), [gateway?.baseURL, gateway?.password, gateway?.username]);

    return useMemo(() => createGatewayQueryClient(gatewayIdentity), [gatewayIdentity]);
};

export const useGatewayApiFor = (gateway: GatewayIdentity) => {
    const gatewayIdentity = useMemo<GatewayIdentity>(() => ({
        baseURL: gateway.baseURL,
        username: gateway.username ?? "",
        password: gateway.password ?? ""
    }), [gateway.baseURL, gateway.password, gateway.username]);

    return useMemo(() => createGatewayQueryClient(gatewayIdentity), [gatewayIdentity]);
};
