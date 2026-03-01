import {useCallback, useState} from "react";
import {AxiosDeviceResponse, useContentModel} from "@/store/store";
import {useQueryClient} from "@tanstack/react-query";
import {useGatewayApi} from "@/hooks/useGatewayApi";

type UseAllThingsRefreshResult = {
    refreshing: boolean,
    refreshError: string | undefined,
    refreshAllThings: () => Promise<void>,
    clearRefreshError: () => void
}

export const useAllThingsRefresh = (): UseAllThingsRefreshResult => {
    const gateway = useContentModel((state) => state.gateway);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const queryClient = useQueryClient();
    const gatewayApi = useGatewayApi();
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | undefined>(undefined);

    const refreshAllThings = useCallback(async () => {
        if (!gateway?.baseURL || refreshing) {
            return;
        }

        setRefreshing(true);
        try {
            const data = await queryClient.fetchQuery(
                gatewayApi.queryOptions("get", "/api/all", undefined, {staleTime: 0})
            );
            setAllThings(data as AxiosDeviceResponse);
            setRefreshError(undefined);
        } catch {
            setRefreshError("Aktualisierung fehlgeschlagen.");
        } finally {
            setRefreshing(false);
        }
    }, [gateway, gatewayApi, queryClient, refreshing, setAllThings]);

    const clearRefreshError = useCallback(() => {
        setRefreshError(undefined);
    }, []);

    return {
        refreshing,
        refreshError,
        refreshAllThings,
        clearRefreshError
    };
};
