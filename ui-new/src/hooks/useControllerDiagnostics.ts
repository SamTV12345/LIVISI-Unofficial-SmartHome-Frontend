import {useEffect, useState} from "react";
import {getJson} from "@/src/api/httpClient.ts";
import {useContentModel} from "@/src/store.tsx";

type DeviceStateEntry = {
    id: string,
    state?: Record<string, {value?: unknown} | null> | null
}

export type ControllerDiagnostics = {
    cpu?: number,
    memory?: number,
    disk?: number
}

// Field names as reported by the SHC itself (SHCA uses cpuUsage/memoryUsage/diskUsage,
// the classic SHC uses CPULoad/memoryLoad) — same source the HA integration reads.
const DIAGNOSTIC_KEYS: [keyof ControllerDiagnostics, string[]][] = [
    ["cpu", ["cpuUsage", "CPULoad"]],
    ["memory", ["memoryUsage", "memoryLoad"]],
    ["disk", ["diskUsage", "diskLoad"]]
];

/**
 * Polls the live /device/states passthrough and extracts the SmartHome
 * Controller's CPU/RAM/disk usage (in percent). Returns undefined until the
 * first successful load; individual fields stay undefined when the SHC does
 * not report them.
 */
export const useControllerDiagnostics = (pollMs = 30000) => {
    const controllerId = useContentModel((state) => {
        const devices = state.allThings?.devices ?? {};
        return Object.values(devices).find((device) => device.type === "SHC" || device.type === "SHCA")?.id;
    });
    const [diagnostics, setDiagnostics] = useState<ControllerDiagnostics | undefined>(undefined);

    useEffect(() => {
        if (!controllerId) {
            return;
        }
        let cancelled = false;

        const load = async () => {
            try {
                const states = await getJson<DeviceStateEntry[]>("/device/states");
                const state = states.find((entry) => entry.id === controllerId)?.state;
                if (cancelled || !state) {
                    return;
                }
                const next: ControllerDiagnostics = {};
                for (const [target, candidates] of DIAGNOSTIC_KEYS) {
                    for (const key of candidates) {
                        const value = state[key]?.value;
                        if (typeof value === "number") {
                            next[target] = value;
                            break;
                        }
                    }
                }
                setDiagnostics(next);
            } catch {
                // ponytail: keep the last known values on transient errors
            }
        };

        void load();
        const interval = setInterval(() => {
            void load();
        }, pollMs);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [controllerId, pollMs]);

    return diagnostics;
};
