import {useCallback, useState} from "react";
import {fetchAPIAll} from "@/lib/api";
import {useContentModel} from "@/store/store";

type UseAllThingsRefreshResult = {
    refreshing: boolean,
    refreshError: string | undefined,
    refreshAllThings: () => Promise<void>,
    clearRefreshError: () => void
}

export const useAllThingsRefresh = (): UseAllThingsRefreshResult => {
    const gateway = useContentModel((state) => state.gateway);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | undefined>(undefined);

    const refreshAllThings = useCallback(async () => {
        if (!gateway?.baseURL || refreshing) {
            return;
        }

        setRefreshing(true);
        try {
            const data = await fetchAPIAll(gateway);
            setAllThings(data);
            setRefreshError(undefined);
        } catch (error) {
            setRefreshError("Aktualisierung fehlgeschlagen.");
        } finally {
            setRefreshing(false);
        }
    }, [gateway, refreshing, setAllThings]);

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
