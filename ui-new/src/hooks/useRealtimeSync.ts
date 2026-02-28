import {useCallback, useEffect, useRef} from "react";
import {AxiosDeviceResponse, useContentModel} from "@/src/store.tsx";
import {SocketClient} from "@/src/realtime/socketClient.ts";
import {SocketMessage} from "@/src/models/SocketMessage.ts";
import {applyRealtimeMessage} from "@/src/realtime/applyRealtimeMessage.ts";
import {openapiFetchClient} from "@/src/api/openapiClient.ts";

const REFRESH_DEBOUNCE_MS = 400;
const FULL_SYNC_INTERVAL_MS = 5 * 60_000;

type RealtimeSyncOptions = {
    skipInitialFetch?: boolean
};

export const useRealtimeSync = ({skipInitialFetch = false}: RealtimeSyncOptions = {}) => {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const setSocketConnected = useContentModel((state) => state.setSocketConnected);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const refreshInFlightRef = useRef(false);
    const refreshQueuedRef = useRef(false);

    const refreshAllThings = useCallback(async () => {
        if (refreshInFlightRef.current) {
            refreshQueuedRef.current = true;
            return;
        }

        refreshInFlightRef.current = true;
        try {
            const response = await openapiFetchClient.GET("/api/all");
            if (!response.data) {
                console.error("Could not refresh /api/all");
                return;
            }
            setAllThings(response.data as AxiosDeviceResponse);
        } catch (error) {
            console.error("Could not refresh /api/all", error);
        } finally {
            refreshInFlightRef.current = false;
            if (refreshQueuedRef.current) {
                refreshQueuedRef.current = false;
                void refreshAllThings();
            }
        }
    }, [setAllThings]);

    const queueRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }
        refreshTimerRef.current = setTimeout(() => {
            void refreshAllThings();
        }, REFRESH_DEBOUNCE_MS);
    }, [refreshAllThings]);

    useEffect(() => {
        if (!skipInitialFetch) {
            void refreshAllThings();
        }
        const fullSyncInterval = setInterval(() => {
            void refreshAllThings();
        }, FULL_SYNC_INTERVAL_MS);

        return () => {
            clearInterval(fullSyncInterval);
        };
    }, [refreshAllThings, skipInitialFetch]);

    useEffect(() => {
        const socketClient = new SocketClient<SocketMessage>({
            onConnectionChange: setSocketConnected,
            onMessage: (message) => {
                const currentState = useContentModel.getState().allThings;
                const patchResult = applyRealtimeMessage(currentState, message);
                if (patchResult.patched && patchResult.nextAllThings) {
                    setAllThings(patchResult.nextAllThings);
                }
                if (patchResult.needsRefresh) {
                    queueRefresh();
                }
            }
        });
        socketClient.connect();

        return () => {
            socketClient.disconnect();
            setSocketConnected(false);
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = undefined;
            }
        };
    }, [queueRefresh, setSocketConnected]);
};
