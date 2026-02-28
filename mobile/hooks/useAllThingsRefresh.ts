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
    const baseURL = useContentModel((state) => state.baseURL);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | undefined>(undefined);

    const refreshAllThings = useCallback(async () => {
        if (!baseURL || refreshing) {
            return;
        }

        setRefreshing(true);
        try {
            const data = await fetchAPIAll(baseURL);
            setAllThings(data);
            setRefreshError(undefined);
        } catch (error) {
            setRefreshError("Aktualisierung fehlgeschlagen.");
        } finally {
            setRefreshing(false);
        }
    }, [baseURL, refreshing, setAllThings]);

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
