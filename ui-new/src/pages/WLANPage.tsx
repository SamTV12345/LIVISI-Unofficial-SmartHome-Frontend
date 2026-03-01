import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {isWifiProfilePresent, useNetworkStatus} from "@/src/hooks/useNetworkStatus.ts";

export const WLANPage = ()=>{
    const {network, activeConnection, loading, error, refresh} = useNetworkStatus();
    const wifiConfigured = isWifiProfilePresent(network);

    return <PageComponent title="WLAN" to="/settings">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox
                variant="gray"
                description={
                    activeConnection === "wlan"
                        ? "WLAN ist aktuell der aktive Adapter."
                        : wifiConfigured
                            ? "WLAN ist konfiguriert, aber aktuell nicht aktiv."
                            : "Es ist aktuell kein aktives WLAN-Profil erkennbar."
                }
            />
            <PageBox>
                <div className="grid grid-cols-2">
                    <div>MAC</div>
                    <div>{network?.wifiMacAddress || "-"}</div>
                    <div>IP</div>
                    <div>{network?.wifiIpAddress || "-"}</div>
                    <div>SSID</div>
                    <div>{network?.wifiActiveSsid || "-"}</div>
                    <div>Signal</div>
                    <div>{network?.wifiSignalStrength ?? 0}</div>
                    <div>WPS</div>
                    <div>{network?.wpsActive ? "Aktiv" : "Inaktiv"}</div>
                    <div>Status</div>
                    <div>{activeConnection === "wlan" ? "Verbunden" : "Nicht verbunden"}</div>
                </div>
            </PageBox>
            <PageBox
                variant="gray"
                description="Für WPS: Router auf WPS stellen und an der Zentrale die PAIR-Taste für 5 Sekunden drücken."
            />
            {(loading || error) && <PageBox variant="gray" description={loading ? "Lade WLAN-Status..." : error}/>}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={() => {
                        void refresh();
                    }}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Aktualisieren
                </button>
            </div>
        </div>
    </PageComponent>
}
