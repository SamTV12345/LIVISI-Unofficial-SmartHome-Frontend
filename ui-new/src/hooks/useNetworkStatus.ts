import {useCallback, useEffect, useMemo, useState} from "react";
import {openapiFetchClient} from "@/src/api/openapiClient.ts";
import {useContentModel} from "@/src/store.tsx";

export type NetworkStatus = {
    backendAvailable?: boolean,
    bluetoothHotspotName?: string,
    ethCableAttached?: boolean,
    ethIpAddress?: string,
    ethMacAddress?: string,
    hostname?: string,
    hotspotActive?: boolean,
    inUseAdapter?: string,
    wifiActiveSsid?: string,
    wifiIpAddress?: string,
    wifiMacAddress?: string,
    wifiSignalStrength?: number,
    wpsActive?: boolean
}

type StatusResponse = {
    connected?: boolean,
    network?: NetworkStatus
}

export type ActiveConnection = "lan" | "wlan" | "none";

const hasText = (value: unknown): value is string => {
    return typeof value === "string" && value.trim().length > 0;
};

const normalizeAdapter = (adapter: string | undefined): ActiveConnection | undefined => {
    if (!adapter) return undefined;
    const normalized = adapter.trim().toLowerCase();
    if (normalized === "eth" || normalized === "ethernet" || normalized === "lan") return "lan";
    if (normalized === "wifi" || normalized === "wi-fi" || normalized === "wlan") return "wlan";
    return undefined;
};

export const resolveActiveConnection = (network: NetworkStatus | undefined): ActiveConnection => {
    const byAdapter = normalizeAdapter(network?.inUseAdapter);
    if (byAdapter) return byAdapter;

    const hasLanAddress = hasText(network?.ethIpAddress);
    const hasWifiAddress = hasText(network?.wifiIpAddress);
    const hasWifiSsid = hasText(network?.wifiActiveSsid);

    if (hasLanAddress && !hasWifiAddress) return "lan";
    if (hasWifiAddress || hasWifiSsid) return "wlan";
    if (network?.ethCableAttached) return "lan";
    return "none";
};

export const isWifiProfilePresent = (network: NetworkStatus | undefined): boolean => {
    return hasText(network?.wifiActiveSsid) || hasText(network?.wifiIpAddress);
};

export const useNetworkStatus = (pollMs = 6000) => {
    const fallbackFromStore = useContentModel((state) => state.allThings?.status?.network as NetworkStatus | undefined);
    const fallbackConnected = useContentModel((state) => state.allThings?.status?.connected as boolean | undefined);
    const [network, setNetwork] = useState<NetworkStatus | undefined>(fallbackFromStore);
    const [controllerConnected, setControllerConnected] = useState<boolean | undefined>(fallbackConnected);
    const [loading, setLoading] = useState<boolean>(!fallbackFromStore);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!network && fallbackFromStore) {
            setNetwork(fallbackFromStore);
        }
    }, [fallbackFromStore, network]);

    useEffect(() => {
        if (controllerConnected === undefined && fallbackConnected !== undefined) {
            setControllerConnected(fallbackConnected);
        }
    }, [controllerConnected, fallbackConnected]);

    const refresh = useCallback(async () => {
        try {
            const response = await openapiFetchClient.GET("/status");
            if (response.error || !response.data) {
                setError("Netzwerkstatus konnte nicht geladen werden.");
                return;
            }
            const status = response.data as StatusResponse;
            if (!status.network) {
                setError("Netzwerkdaten sind aktuell nicht verfügbar.");
                return;
            }
            setNetwork(status.network);
            setControllerConnected(status.connected);
            setError(undefined);
        } catch {
            setError("Netzwerkstatus konnte nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
        const interval = setInterval(() => {
            void refresh();
        }, pollMs);
        return () => clearInterval(interval);
    }, [pollMs, refresh]);

    const activeConnection = useMemo(() => resolveActiveConnection(network), [network]);
    return {
        network,
        controllerConnected,
        activeConnection,
        loading,
        error,
        refresh
    };
};
