import {RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {useMemo} from "react";
import {useContentModel} from "@/store/store";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {StatusPill} from "@/components/ui/StatusPill";
import {useAppColors} from "@/hooks/useAppColors";
import {AppPalette} from "@/constants/Colors";

const InfoRow = ({
    label,
    value,
    styles
}: {
    label: string;
    value: string | number | undefined;
    styles: ReturnType<typeof createStyles>;
}) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{String(value ?? "-")}</Text>
    </View>
);

export default function NetworkScreen() {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const network = allThings?.status.network;
    const ethConnected = useMemo(() => network?.ethCableAttached === true, [network?.ethCableAttached]);
    const ssidValue = useMemo(() => {
        const rawSsid = network?.wifiActiveSsid?.trim();
        if (rawSsid) {
            return rawSsid;
        }
        return ethConnected ? "Kein WLAN aktiv (LAN)" : "Kein WLAN verbunden";
    }, [ethConnected, network?.wifiActiveSsid]);

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
                    <InfoRow label="Aktiver Adapter" value={network?.inUseAdapter} styles={styles}/>
                    <InfoRow label="Hostname" value={network?.hostname} styles={styles}/>
                    <InfoRow label="Signalstärke" value={network?.wifiSignalStrength} styles={styles}/>
                </SurfaceCard>

                <SectionHeader title="IPv4"/>
                <SurfaceCard>
                    <InfoRow label="IP-Adresse" value={ethConnected ? network?.ethIpAddress : network?.wifiIpAddress} styles={styles}/>
                    <InfoRow label="MAC-Adresse" value={ethConnected ? network?.ethMacAddress : network?.wifiMacAddress} styles={styles}/>
                    <InfoRow label="SSID" value={ssidValue} styles={styles}/>
                </SurfaceCard>
            </ScrollView>
        </AppScreen>
    );
}

const createStyles = (colors: AppPalette) => StyleSheet.create({
    infoRow: {
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    infoLabel: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 4
    },
    infoValue: {
        fontSize: 16,
        color: colors.text,
        fontWeight: "700"
    }
});
