import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {HttpRequestError, postJson} from "@/src/api/httpClient.ts";
import {useContentModel} from "@/src/store.tsx";
import {isWifiProfilePresent, useNetworkStatus} from "@/src/hooks/useNetworkStatus.ts";

export const NetworkPage = ()=>{
    const navigate = useNavigate();
    const allThings = useContentModel(state => state.allThings);
    const {network, controllerConnected, activeConnection, error, loading, refresh} = useNetworkStatus();
    const [pendingAction, setPendingAction] = useState<"switch" | "wps" | undefined>(undefined);
    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined);
    const [actionError, setActionError] = useState<string | undefined>(undefined);
    const [switchRequested, setSwitchRequested] = useState(false);

    const shc = useMemo(() => {
        return Object.values(allThings?.devices ?? {}).find((device) => device.type === "SHCA");
    }, [allThings?.devices]);

    const wifiConfigured = isWifiProfilePresent(network);

    useEffect(() => {
        if (!switchRequested) return;
        if (activeConnection === "wlan") {
            setSwitchRequested(false);
            setInfoMessage("Wechsel auf WLAN erfolgreich erkannt.");
            setActionError(undefined);
        }
    }, [activeConnection, switchRequested]);

    const connectionLabel = activeConnection === "lan"
        ? "LAN verbunden"
        : activeConnection === "wlan"
            ? "WLAN verbunden"
            : "Keine aktive Verbindung";

    const runShcAction = async (actionTypes: string[]): Promise<boolean> => {
        if (!shc?.id) {
            throw new Error("SHC nicht gefunden.");
        }

        for (const type of actionTypes) {
            try {
                await postJson("/action", {
                    id: shc.id,
                    type,
                    target: "/device/" + shc.id,
                    namespace: shc.product ?? "core.RWE"
                });
                return true;
            } catch (error) {
                if (error instanceof HttpRequestError) {
                    const maybeUnknownAction = error.responseText.includes("Action [") && error.responseText.includes("not found in entity");
                    if (maybeUnknownAction) {
                        continue;
                    }
                }
            }
        }
        return false;
    };

    const switchToWlan = async () => {
        setPendingAction("switch");
        setInfoMessage(undefined);
        setActionError(undefined);

        try {
            if (activeConnection === "wlan") {
                setInfoMessage("WLAN ist bereits aktiv.");
                return;
            }

            if (!wifiConfigured) {
                setInfoMessage("Es ist aktuell kein aktives WLAN-Profil erkennbar. Bitte zuerst WLAN einrichten.");
                return;
            }

            const switchedByAction = await runShcAction(["SwitchToWlan", "SwitchToWLAN", "SwitchToWifi", "SwitchToWiFi"]);
            if (switchedByAction) {
                setInfoMessage("Wechsel auf WLAN wurde ausgelöst. Status wird jetzt überwacht.");
            } else {
                setInfoMessage("Automatischer API-Wechsel nicht verfügbar. Ziehe das LAN-Kabel ab, die Zentrale wechselt dann auf WLAN.");
            }
            setSwitchRequested(true);
            void refresh();
        } catch {
            setActionError("WLAN-Wechsel konnte nicht gestartet werden.");
        } finally {
            setPendingAction(undefined);
        }
    };

    const startWps = async () => {
        setPendingAction("wps");
        setInfoMessage(undefined);
        setActionError(undefined);
        try {
            const startedByAction = await runShcAction(["StartWPS", "StartWps", "ActivateWPS", "ActivateWps", "EnableWPS", "EnableWps"]);
            if (startedByAction) {
                setInfoMessage("WPS wurde gestartet. Folge jetzt der Router-Anleitung.");
            } else {
                setInfoMessage("WPS-API nicht verfügbar. Bitte PAIR-Taste an der Zentrale (5 Sek.) und WPS-Taste am Router verwenden.");
            }
            void refresh();
        } catch {
            setActionError("WPS konnte nicht gestartet werden.");
        } finally {
            setPendingAction(undefined);
        }
    };

    return <PageComponent
        to={"/settings"}
        title="Netzwerk"
        actionButton={<button
            type="button"
            onClick={() => {
                void refresh();
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
            Aktualisieren
        </button>}
    >
        <div className="space-y-4 p-4 md:p-6">
            <PageBox variant="default">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="text-sm text-slate-500">Aktueller Verbindungsstatus</div>
                        <div className="text-xl font-semibold text-slate-900">{connectionLabel}</div>
                        <div className="text-xs text-slate-500">Adapter: {network?.inUseAdapter || "-"}</div>
                    </div>
                    <div className="flex justify-center">
                        <img
                            className="network-img"
                            src={activeConnection === "lan" ? "/images/svg_single/connected_wired.svg" : "/images/svg_single/connected_wireless.svg"}
                            alt="Network connection overview"
                        />
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">Hostname</div>
                        <div className="font-semibold text-slate-900">{network?.hostname || "-"}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">Livisi-Backend</div>
                        <div className="font-semibold text-slate-900">{network?.backendAvailable ? "Ja" : "Nein"}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">WPS aktiv</div>
                        <div className="font-semibold text-slate-900">{network?.wpsActive ? "Ja" : "Nein"}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">WLAN Signal</div>
                        <div className="font-semibold text-slate-900">{network?.wifiSignalStrength ?? 0}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">Zentrale verbunden</div>
                        <div className="font-semibold text-slate-900">{controllerConnected ? "Ja" : "Nein"}</div>
                    </div>
                </div>
            </PageBox>

            <PageBox
                description={
                    activeConnection === "lan"
                        ? "Ihre Zentrale nutzt aktuell die LAN-Verbindung."
                        : activeConnection === "wlan"
                            ? "Ihre Zentrale nutzt aktuell die WLAN-Verbindung."
                            : "Aktuell konnte keine aktive Netzwerkverbindung erkannt werden."
                }
                variant="gray"
            />

            {controllerConnected && network?.backendAvailable === false && (
                <PageBox
                    variant="gray"
                    description="Lokale Verbindung ist aktiv, aber die Zentrale meldet keinen Cloud-Backend-Zugriff."
                />
            )}

            <PageBox
                title="LAN"
                description={activeConnection === "lan" ? "Verbunden" : network?.ethCableAttached ? "Kabel erkannt, aber nicht aktiv" : "Nicht verbunden"}
                variant="default"
                to="/settings/lan"
            />

            <PageBox
                title="WLAN"
                description={activeConnection === "wlan" ? "Verbunden" : wifiConfigured ? "Konfiguriert" : "Nicht konfiguriert"}
                variant="default"
                to="/settings/wlan"
            />

            {(loading || error || actionError || infoMessage) && (
                <PageBox variant="gray">
                    {loading && <div className="text-sm text-slate-500">Lade Netzwerkstatus...</div>}
                    {error && <div className="text-sm text-red-700">{error}</div>}
                    {actionError && <div className="text-sm text-red-700">{actionError}</div>}
                    {infoMessage && <div className="text-sm text-slate-700">{infoMessage}</div>}
                </PageBox>
            )}

            <div className="flex flex-col gap-4 pt-2">
                <PrimaryButton
                    onClick={() => {
                        void startWps();
                        navigate("/settings/wlan");
                    }}
                    disabled={pendingAction !== undefined}
                >
                    WI-FI Verbindung über WPS
                </PrimaryButton>
                <PrimaryButton
                    onClick={() => {
                        void switchToWlan();
                    }}
                    disabled={pendingAction !== undefined || activeConnection === "wlan"}
                >
                    {pendingAction === "switch" ? "WLAN-Wechsel wird gestartet..." : "Zu WLAN wechseln"}
                </PrimaryButton>
            </div>
        </div>
    </PageComponent>
}
