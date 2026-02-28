import {RefreshControl, ScrollView, Text, View} from "react-native";
import {useMemo} from "react";
import {useContentModel} from "@/store/store";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {StatusPill} from "@/components/ui/StatusPill";

const InfoRow = ({label, value}: {label: string; value: string | number | undefined}) => (
    <View style={{paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e7edf3"}}>
        <Text style={{fontSize: 13, color: "#5f7388", marginBottom: 4}}>{label}</Text>
        <Text style={{fontSize: 15, color: "#102a43", fontWeight: "600"}}>{String(value ?? "-")}</Text>
    </View>
);

export default function NetworkScreen() {
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const network = allThings?.status.network;
    const ethConnected = useMemo(() => network?.ethCableAttached === true, [network?.ethCableAttached]);

    return (
        <AppScreen title="Netzwerk" subtitle="Status und Adapterdaten" scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}

                <SectionHeader title="Verbindung"/>
                <SurfaceCard style={{marginBottom: 14}}>
                    <StatusPill label={ethConnected ? "LAN verbunden" : "WLAN verbunden"} tone={ethConnected ? "success" : "primary"}/>
                    <View style={{height: 8}}/>
                    <InfoRow label="Aktiver Adapter" value={network?.inUseAdapter}/>
                    <InfoRow label="Hostname" value={network?.hostname}/>
                    <InfoRow label="Signalstärke" value={network?.wifiSignalStrength}/>
                </SurfaceCard>

                <SectionHeader title="IPv4"/>
                <SurfaceCard>
                    <InfoRow label="IP-Adresse" value={ethConnected ? network?.ethIpAddress : network?.wifiIpAddress}/>
                    <InfoRow label="MAC-Adresse" value={ethConnected ? network?.ethMacAddress : network?.wifiMacAddress}/>
                    <InfoRow label="SSID" value={network?.wifiActiveSsid}/>
                </SurfaceCard>
            </ScrollView>
        </AppScreen>
    );
}
