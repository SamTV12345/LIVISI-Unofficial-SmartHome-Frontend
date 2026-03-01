import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {useNetworkStatus} from "@/src/hooks/useNetworkStatus.ts";

export const LANPage = ()=>{
    const {network, activeConnection, loading, error, refresh} = useNetworkStatus();

    return <PageComponent title="LAN" to="/settings">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox variant="gray" description={activeConnection === "lan" ? "LAN ist aktuell der aktive Adapter." : "LAN ist aktuell nicht der aktive Adapter."}/>
            <PageBox>
            <div className="grid grid-cols-2">
                <div>MAC</div>
                <div>{network?.ethMacAddress || "-"}</div>
                <div>IP</div>
                <div>{network?.ethIpAddress || "-"}</div>
                <div>Kabel</div>
                <div>{network?.ethCableAttached ? "Eingesteckt" : "Nicht eingesteckt"}</div>
                <div>Status</div>
                <div>{activeConnection === "lan" ? "Verbunden" : "Nicht verbunden"}</div>
            </div>
            </PageBox>
            {(loading || error) && <PageBox variant="gray" description={loading ? "Lade LAN-Status..." : error}/>}
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
