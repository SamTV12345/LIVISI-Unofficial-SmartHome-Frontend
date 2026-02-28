import {useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {FormField} from "@/components/ui/FormField";
import {ActionButton} from "@/components/ui/ActionButton";
import {isValidHttpUrl} from "@/utils/url";
import {fetchAPIConfig} from "@/lib/api";
import {saveGatewayConfig, updateServerConfig} from "@/utils/sqlite";

export default function SmarthomeDetailAdd() {
    const [baseURL, setBaseURL] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [label, setLabel] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const onSave = async () => {
        const nextBaseURL = baseURL.trim();
        if (!isValidHttpUrl(nextBaseURL)) {
            setError("URL ist nicht gültig.");
            return;
        }

        setIsSaving(true);
        setError("");
        try {
            const gateway = {
                baseURL: nextBaseURL,
                username: username.trim(),
                password,
                label: label.trim()
            };
            const config = await fetchAPIConfig(gateway);
            saveGatewayConfig({
                id: gateway.baseURL,
                username: gateway.username,
                password: gateway.password,
                label: gateway.label
            });
            updateServerConfig(config, gateway.baseURL);
            router.replace("/login/smarthomeSelection");
        } catch {
            setError("Server nicht erreichbar oder Zugangsdaten ungültig.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppScreen title="Gateway hinzufügen" subtitle="Speichere ein weiteres Livisi Gateway.">
            <SurfaceCard>
                <FormField
                    label="Gateway-URL"
                    value={baseURL}
                    onChangeText={setBaseURL}
                    placeholder="http://192.168.x.x"
                    keyboardType="url"
                />
                <FormField
                    label="Benutzername (optional)"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="admin"
                />
                <FormField
                    label="Passwort (optional)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="********"
                />
                <FormField
                    label="Anzeigename (optional)"
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Ferienhaus"
                    autoCapitalize="sentences"
                />
                {error ? <Text style={{color: "#b3384a", marginBottom: 10}}>{error}</Text> : null}
                <ActionButton title={isSaving ? "Prüfe..." : "Verbindung testen und speichern"} onPress={onSave} disabled={isSaving}/>
            </SurfaceCard>
        </AppScreen>
    );
}
