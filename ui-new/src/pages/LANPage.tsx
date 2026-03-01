import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {useNetworkStatus} from "@/src/hooks/useNetworkStatus.ts";
import {useTranslation} from "react-i18next";

export const LANPage = ()=>{
    const {network, activeConnection, loading, error, refresh} = useNetworkStatus();
    const {t} = useTranslation();

    return <PageComponent title={t("ui_new.lan.title")} to="/settings">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox variant="gray" description={activeConnection === "lan" ? t("ui_new.lan.active_adapter") : t("ui_new.lan.inactive_adapter")}/>
            <PageBox>
            <div className="grid grid-cols-2">
                <div>{t("ui_new.common.mac")}</div>
                <div>{network?.ethMacAddress || "-"}</div>
                <div>{t("ui_new.common.ip")}</div>
                <div>{network?.ethIpAddress || "-"}</div>
                <div>{t("ui_new.lan.cable")}</div>
                <div>{network?.ethCableAttached ? t("ui_new.lan.cable_plugged") : t("ui_new.lan.cable_unplugged")}</div>
                <div>{t("ui_new.common.status")}</div>
                <div>{activeConnection === "lan" ? t("ui_new.common.connected") : t("ui_new.common.not_connected")}</div>
            </div>
            </PageBox>
            {(loading || error) && <PageBox variant="gray" description={loading ? t("ui_new.lan.loading_status") : error}/>}
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
