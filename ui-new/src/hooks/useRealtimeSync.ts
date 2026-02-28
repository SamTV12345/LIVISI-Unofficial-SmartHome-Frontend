import {useCallback, useEffect, useRef} from "react";
import axios, {AxiosResponse} from "axios";
import {AxiosDeviceResponse, useContentModel} from "@/src/store.tsx";
import {SocketClient} from "@/src/realtime/socketClient.ts";
import {SocketMessage} from "@/src/models/SocketMessage.ts";
import {applyRealtimeMessage} from "@/src/realtime/applyRealtimeMessage.ts";

const REFRESH_DEBOUNCE_MS = 400;
const FULL_SYNC_INTERVAL_MS = 5 * 60_000;

export const useRealtimeSync = () => {
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
            const response: AxiosResponse<AxiosDeviceResponse> = await axios.get("/api/all");
            setAllThings(response.data);
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
        void refreshAllThings();
        const fullSyncInterval = setInterval(() => {
            void refreshAllThings();
        }, FULL_SYNC_INTERVAL_MS);

        return () => {
            clearInterval(fullSyncInterval);
        };
    }, [refreshAllThings]);

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
