import {useCallback, useState} from "react";
import {Alert, Text, View} from "react-native";
import {useFocusEffect, useRouter} from "expo-router";
import {AppconfigData, deleteBaseURL, getAllBaseURLs, saveGatewayConfig} from "@/utils/sqlite";
import {useContentModel} from "@/store/store";
import {fetchAPIConfig} from "@/lib/api";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {ActionButton} from "@/components/ui/ActionButton";
import {NavRow} from "@/components/ui/NavRow";
import {StatusPill} from "@/components/ui/StatusPill";

export default function SmartHomeSelection() {
    const router = useRouter();
    const [savedGateways, setSavedGateways] = useState<AppconfigData[]>([]);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);
    const setGateway = useContentModel((state) => state.setGateway);
    const setConfig = useContentModel((state) => state.setConfig);

    const refreshGateways = useCallback(() => {
        setSavedGateways(getAllBaseURLs());
    }, []);

    useFocusEffect(useCallback(() => {
        refreshGateways();
    }, [refreshGateways]));

    const connectToGateway = async (entry: AppconfigData) => {
        const gateway = {
            baseURL: entry.id,
            username: entry.username ?? "",
            password: entry.password ?? "",
            label: entry.label ?? ""
        };

        setIsConnecting(entry.id);
        try {
            const config = await fetchAPIConfig(gateway);
            saveGatewayConfig({
                id: entry.id,
                username: entry.username,
                password: entry.password,
                label: entry.label
            });
            setGateway(gateway);
            setConfig(config);
            router.replace("/main/devices/(tabs)");
        } catch {
            Alert.alert("Verbindung fehlgeschlagen", "Das Gateway antwortet nicht mit den gespeicherten Daten.");
        } finally {
            setIsConnecting(null);
        }
    };

    const removeGateway = (entry: AppconfigData) => {
        Alert.alert("Gateway löschen?", `${entry.label || entry.id} wird entfernt.`, [
            {text: "Abbrechen", style: "cancel"},
            {
                text: "Löschen",
                style: "destructive",
                onPress: () => {
                    deleteBaseURL(entry.id);
                    refreshGateways();
                }
            }
        ]);
    };

    return (
        <AppScreen
            title="Gespeicherte Gateways"
            subtitle="Wähle ein Gateway aus oder lege ein neues an."
        >
            <SurfaceCard style={{marginBottom: 14}}>
                {savedGateways.length === 0 ? (
                    <Text>Keine Gateways gespeichert.</Text>
                ) : (
                    savedGateways.map((entry, index) => (
                        <View key={entry.id} style={{
                            borderBottomWidth: index < savedGateways.length - 1 ? 1 : 0,
                            borderBottomColor: "#e5edf4",
                            paddingBottom: 12,
                            marginBottom: index < savedGateways.length - 1 ? 12 : 0
                        }}>
                            <NavRow
                                title={entry.label || entry.id}
                                subtitle={entry.label ? entry.id : "Ohne Anzeigename"}
                                onPress={() => {
                                    void connectToGateway(entry);
                                }}
                            />
                            <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                                {entry.active ? <StatusPill label="Aktiv" tone="success"/> : <StatusPill label="Gespeichert" tone="neutral"/>}
                                <ActionButton
                                    title={isConnecting === entry.id ? "Verbinde..." : "Löschen"}
                                    onPress={() => removeGateway(entry)}
                                    variant="ghost"
                                    disabled={isConnecting === entry.id}
                                />
                            </View>
                        </View>
                    ))
                )}
            </SurfaceCard>

            <ActionButton title="Neues Gateway hinzufügen" onPress={() => router.push("/login/SmarthomeDetailAdd")}/>
        </AppScreen>
    );
}
