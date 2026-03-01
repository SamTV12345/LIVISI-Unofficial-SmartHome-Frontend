import {RefreshControl, ScrollView, View} from "react-native";
import {router} from "expo-router";
import {useContentModel} from "@/store/store";
import {setAllInactive} from "@/utils/sqlite";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {NavRow} from "@/components/ui/NavRow";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {Colors} from "@/constants/Colors";

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
        <AppScreen scroll={false}>
            <ScrollView
                overScrollMode="always"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title="Einstellungen"
                    subtitle={gateway?.label || gateway?.baseURL || "Kein aktives Gateway"}
                    badges={[
                        {
                            label: gateway?.baseURL ? "Gateway verbunden" : "Kein Gateway",
                            icon: <MaterialCommunityIcons size={12} color="white" name="lan-connect"/>
                        }
                    ]}
                    stats={[
                        {label: "Verbindung", value: gateway?.baseURL ? "Aktiv" : "Inaktiv"},
                        {label: "Refresh", value: refreshing ? "Läuft" : "Bereit"},
                        {label: "Profil", value: gateway?.label || "Standard"},
                        {label: "Bereiche", value: 3}
                    ]}
                />

                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}

                <ModernSection
                    title="Verbindung"
                    description="Gateway und Netzwerk"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="lan"/>}
                    style={{marginBottom: 14}}
                >
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
                </ModernSection>

                <ModernSection
                    title="Benachrichtigungen"
                    description="SMTP und Empfänger"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="email-outline"/>}
                    style={{marginBottom: 14}}
                >
                    <NavRow
                        title="Nachrichten"
                        subtitle="Systemmeldungen und Warnungen"
                        onPress={() => router.push("/main/news")}
                    />
                    <View style={{height: 1, backgroundColor: "#e7edf3"}}/>
                    <NavRow
                        title="E-Mail"
                        subtitle="SMTP und Empfänger konfigurieren"
                        onPress={() => router.push("/main/settings/email")}
                    />
                </ModernSection>

                <ModernSection
                    title="Session"
                    description="Aktive Anmeldung"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="account-circle-outline"/>}
                    style={{marginBottom: 14}}
                >
                    <NavRow
                        title="Abmelden"
                        subtitle="Aktive Gateway-Sitzung beenden"
                        onPress={logout}
                        danger
                    />
                </ModernSection>
            </ScrollView>
        </AppScreen>
    );
}
