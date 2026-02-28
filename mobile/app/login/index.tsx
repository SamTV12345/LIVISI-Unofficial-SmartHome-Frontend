import {useState} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {fetchAPIConfig} from "@/lib/api";
import {saveGatewayConfig, updateServerConfig} from "@/utils/sqlite";
import {useContentModel} from "@/store/store";
import {isValidHttpUrl} from "@/utils/url";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {FormField} from "@/components/ui/FormField";
import {ActionButton} from "@/components/ui/ActionButton";
import {Colors} from "@/constants/Colors";

export default function LoginScreen() {
    const gateway = useContentModel((state) => state.gateway);
    const setGateway = useContentModel((state) => state.setGateway);
    const setConfig = useContentModel((state) => state.setConfig);
    const [baseURL, setBaseURL] = useState(gateway?.baseURL ?? "");
    const [username, setUsername] = useState(gateway?.username ?? "");
    const [password, setPassword] = useState(gateway?.password ?? "");
    const [label, setLabel] = useState(gateway?.label ?? "");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const connectGateway = async () => {
        const normalizedBaseURL = (baseURL ?? "").trim();
        if (!isValidHttpUrl(normalizedBaseURL)) {
            setError("Bitte eine gültige URL mit http:// oder https:// eingeben.");
            return;
        }

        setError("");
        setIsLoading(true);
        const nextGateway = {
            baseURL: normalizedBaseURL,
            username: username.trim(),
            password,
            label: label.trim()
        };

        try {
            const config = await fetchAPIConfig(nextGateway);
            saveGatewayConfig({
                id: nextGateway.baseURL,
                username: nextGateway.username,
                password: nextGateway.password,
                label: nextGateway.label
            });
            updateServerConfig(config, nextGateway.baseURL);
            setGateway(nextGateway);
            setConfig(config);
            router.replace("/main/devices/(tabs)");
        } catch {
            setError("Verbindung fehlgeschlagen. URL oder Zugangsdaten prüfen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppScreen
            title="Livisi Gateway"
            subtitle="Verbinde dein lokales Gateway und verwalte mehrere Zugänge."
            scroll
        >
            <SurfaceCard style={{marginBottom: 14}}>
                <FormField
                    label="Gateway-URL"
                    value={baseURL}
                    onChangeText={(value) => {
                        setError("");
                        setBaseURL(value);
                    }}
                    placeholder="http://192.168.x.x"
                    keyboardType="url"
                    autoCapitalize="none"
                />
                <FormField
                    label="Benutzername (optional)"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="admin"
                    autoCapitalize="none"
                />
                <FormField
                    label="Passwort (optional)"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    secureTextEntry
                    autoCapitalize="none"
                />
                <FormField
                    label="Anzeigename (optional)"
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Zuhause"
                    autoCapitalize="sentences"
                />
                {error ? <Text style={{color: "#b3384a", marginBottom: 10}}>{error}</Text> : null}
                <ActionButton title={isLoading ? "Verbinde..." : "Verbinden"} onPress={connectGateway} disabled={isLoading}/>
            </SurfaceCard>

            <SurfaceCard muted>
                <Text style={{color: Colors.app.text, fontWeight: "700", marginBottom: 8}}>Weitere Optionen</Text>
                <View style={{gap: 10}}>
                    <ActionButton title="Gespeicherte Gateways" onPress={() => router.push("/login/smarthomeSelection")} variant="ghost"/>
                    <ActionButton title="Neues Gateway anlegen" onPress={() => router.push("/login/SmarthomeDetailAdd")} variant="ghost"/>
                </View>
            </SurfaceCard>
        </AppScreen>
    );
}
