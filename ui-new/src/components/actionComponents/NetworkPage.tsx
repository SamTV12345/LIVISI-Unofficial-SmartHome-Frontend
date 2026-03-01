import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {HttpRequestError, postJson} from "@/src/api/httpClient.ts";
import {useContentModel} from "@/src/store.tsx";
import {isWifiProfilePresent, useNetworkStatus} from "@/src/hooks/useNetworkStatus.ts";
import {useTranslation} from "react-i18next";

export const NetworkPage = ()=>{
    const navigate = useNavigate();
    const {t} = useTranslation();
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
            setInfoMessage(t("ui_new.network.switch_success_detected"));
            setActionError(undefined);
        }
    }, [activeConnection, switchRequested, t]);

    const connectionLabel = activeConnection === "lan"
        ? t("ui_new.network.lan_connected")
        : activeConnection === "wlan"
            ? t("ui_new.network.wlan_connected")
            : t("ui_new.network.no_active_connection");

    const runShcAction = async (actionTypes: string[]): Promise<boolean> => {
        if (!shc?.id) {
            throw new Error(t("ui_new.network.shc_not_found"));
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
                setInfoMessage(t("ui_new.network.wlan_already_active"));
                return;
            }

            if (!wifiConfigured) {
                setInfoMessage(t("ui_new.network.no_wlan_profile"));
                return;
            }

            const switchedByAction = await runShcAction(["SwitchToWlan", "SwitchToWLAN", "SwitchToWifi", "SwitchToWiFi"]);
            if (switchedByAction) {
                setInfoMessage(t("ui_new.network.switch_triggered"));
            } else {
                setInfoMessage(t("ui_new.network.switch_manual_hint"));
            }
            setSwitchRequested(true);
            void refresh();
        } catch {
            setActionError(t("ui_new.network.switch_failed"));
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
                setInfoMessage(t("ui_new.network.wps_started"));
            } else {
                setInfoMessage(t("ui_new.network.wps_manual_hint"));
            }
            void refresh();
        } catch {
            setActionError(t("ui_new.network.wps_failed"));
        } finally {
            setPendingAction(undefined);
        }
    };

    return <PageComponent
        to={"/settings"}
        title={t("ui_new.network.page_title")}
        actionButton={<button
            type="button"
            onClick={() => {
                void refresh();
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
            {t("ui_new.common.refresh")}
        </button>}
    >
        <div className="space-y-4 p-4 md:p-6">
            <PageBox variant="default">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="text-sm text-slate-500">{t("ui_new.network.current_status")}</div>
                        <div className="text-xl font-semibold text-slate-900">{connectionLabel}</div>
                        <div className="text-xs text-slate-500">{t("ui_new.network.adapter")}: {network?.inUseAdapter || "-"}</div>
                    </div>
                    <div className="flex justify-center">
                        <img
                            className="network-img"
                            src={activeConnection === "lan" ? "/images/svg_single/connected_wired.svg" : "/images/svg_single/connected_wireless.svg"}
                            alt={t("ui_new.network.connection_overview_alt")}
                        />
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">{t("ui_new.network.hostname")}</div>
                        <div className="font-semibold text-slate-900">{network?.hostname || "-"}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">{t("ui_new.network.backend")}</div>
                        <div className="font-semibold text-slate-900">{network?.backendAvailable ? t("ui_new.common.yes") : t("ui_new.common.no")}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">{t("ui_new.network.wps_active")}</div>
                        <div className="font-semibold text-slate-900">{network?.wpsActive ? t("ui_new.common.yes") : t("ui_new.common.no")}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">{t("ui_new.network.wlan_signal")}</div>
                        <div className="font-semibold text-slate-900">{network?.wifiSignalStrength ?? 0}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-slate-500">{t("ui_new.network.controller_connected")}</div>
                        <div className="font-semibold text-slate-900">{controllerConnected ? t("ui_new.common.yes") : t("ui_new.common.no")}</div>
                    </div>
                </div>
            </PageBox>

            <PageBox
                description={
                    activeConnection === "lan"
                        ? t("ui_new.network.currently_using_lan")
                        : activeConnection === "wlan"
                            ? t("ui_new.network.currently_using_wlan")
                            : t("ui_new.network.no_connection_detected")
                }
                variant="gray"
            />

            {controllerConnected && network?.backendAvailable === false && (
                <PageBox
                    variant="gray"
                    description={t("ui_new.network.local_but_no_cloud")}
                />
            )}

            <PageBox
                title={t("ui_new.lan.title")}
                description={activeConnection === "lan" ? t("ui_new.common.connected") : network?.ethCableAttached ? t("ui_new.network.cable_detected_not_active") : t("ui_new.common.not_connected")}
                variant="default"
                to="/settings/lan"
            />

            <PageBox
                title={t("ui_new.wlan.title")}
                description={activeConnection === "wlan" ? t("ui_new.common.connected") : wifiConfigured ? t("ui_new.network.configured") : t("ui_new.network.not_configured")}
                variant="default"
                to="/settings/wlan"
            />

            {(loading || error || actionError || infoMessage) && (
                <PageBox variant="gray">
                    {loading && <div className="text-sm text-slate-500">{t("ui_new.network.loading_status")}</div>}
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
                    {t("ui_new.network.wifi_via_wps")}
                </PrimaryButton>
                <PrimaryButton
                    onClick={() => {
                        void switchToWlan();
                    }}
                    disabled={pendingAction !== undefined || activeConnection === "wlan"}
                >
                    {pendingAction === "switch" ? t("ui_new.network.switch_starting") : t("ui_new.network.switch_to_wlan")}
                </PrimaryButton>
            </div>
        </div>
    </PageComponent>
}
