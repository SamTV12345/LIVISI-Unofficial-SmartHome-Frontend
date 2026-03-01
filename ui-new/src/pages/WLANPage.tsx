import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {isWifiProfilePresent, useNetworkStatus} from "@/src/hooks/useNetworkStatus.ts";
import {useTranslation} from "react-i18next";

export const WLANPage = ()=>{
    const {network, activeConnection, loading, error, refresh} = useNetworkStatus();
    const wifiConfigured = isWifiProfilePresent(network);
    const {t} = useTranslation();

    return <PageComponent title={t("ui_new.wlan.title")} to="/settings">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox
                variant="gray"
                description={
                    activeConnection === "wlan"
                        ? t("ui_new.wlan.active_adapter")
                        : wifiConfigured
                            ? t("ui_new.wlan.configured_but_inactive")
                            : t("ui_new.wlan.no_active_profile")
                }
            />
            <PageBox>
                <div className="grid grid-cols-2">
                    <div>{t("ui_new.common.mac")}</div>
                    <div>{network?.wifiMacAddress || "-"}</div>
                    <div>{t("ui_new.common.ip")}</div>
                    <div>{network?.wifiIpAddress || "-"}</div>
                    <div>{t("ui_new.wlan.ssid")}</div>
                    <div>{network?.wifiActiveSsid || "-"}</div>
                    <div>{t("ui_new.wlan.signal")}</div>
                    <div>{network?.wifiSignalStrength ?? 0}</div>
                    <div>{t("ui_new.wlan.wps")}</div>
                    <div>{network?.wpsActive ? t("ui_new.common.active") : t("ui_new.common.inactive")}</div>
                    <div>{t("ui_new.common.status")}</div>
                    <div>{activeConnection === "wlan" ? t("ui_new.common.connected") : t("ui_new.common.not_connected")}</div>
                </div>
            </PageBox>
            <PageBox
                variant="gray"
                description={t("ui_new.wlan.wps_hint")}
            />
            {(loading || error) && <PageBox variant="gray" description={loading ? t("ui_new.wlan.loading_status") : error}/>}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={() => {
                        void refresh();
                    }}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    {t("ui_new.common.refresh")}
                </button>
            </div>
        </div>
    </PageComponent>
}
