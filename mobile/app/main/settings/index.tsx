import {RefreshControl, ScrollView, View} from "react-native";
import {router} from "expo-router";
import {useContentModel} from "@/store/store";
import {setAllInactive} from "@/utils/sqlite";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {NavRow} from "@/components/ui/NavRow";

export default function SettingsPage() {
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();
    const gateway = useContentModel((state) => state.gateway);
    const setGateway = useContentModel((state) => state.setGateway);

    const logout = () => {
        setAllInactive();
        setGateway(undefined);
        router.replace("/login");
    };

    return (
        <AppScreen
            title="Einstellungen"
            subtitle={gateway?.label || gateway?.baseURL || "Kein aktives Gateway"}
            scroll={false}
        >
            <ScrollView
                overScrollMode="always"
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
                    <NavRow
                        title="Gateway konfigurieren"
                        subtitle="URL, Nutzername und Passwort verwalten"
                        onPress={() => router.push("/main/settings/gateway")}
                    />
                    <View style={{height: 1, backgroundColor: "#e7edf3"}}/>
                    <NavRow
                        title="Netzwerk"
                        subtitle="Lokale Netzwerkdaten der Zentrale"
                        onPress={() => router.push("/main/settings/network")}
                    />
                </SurfaceCard>

                <SectionHeader title="Benachrichtigungen"/>
                <SurfaceCard style={{marginBottom: 14}}>
                    <NavRow
                        title="E-Mail"
                        subtitle="SMTP und Empfänger konfigurieren"
                        onPress={() => router.push("/main/settings/email")}
                    />
                </SurfaceCard>

                <SectionHeader title="Session"/>
                <SurfaceCard>
                    <NavRow
                        title="Abmelden"
                        subtitle="Aktive Gateway-Sitzung beenden"
                        onPress={logout}
                        danger
                    />
                </SurfaceCard>
            </ScrollView>
        </AppScreen>
    );
}
