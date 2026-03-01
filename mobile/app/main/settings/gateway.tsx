import {useEffect, useMemo, useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {FormField} from "@/components/ui/FormField";
import {ActionButton} from "@/components/ui/ActionButton";
import {useContentModel} from "@/store/store";
import {saveGatewayConfig, updateServerConfig} from "@/utils/sqlite";
import {isValidHttpUrl} from "@/utils/url";
import {useGatewayApiFor} from "@/hooks/useGatewayApi";
import {useQueryClient} from "@tanstack/react-query";
import {ConfigData} from "@/models/ConfigData";

export default function GatewaySettingsScreen() {
    const gateway = useContentModel((state) => state.gateway);
    const setGateway = useContentModel((state) => state.setGateway);
    const setConfig = useContentModel((state) => state.setConfig);
    const queryClient = useQueryClient();

    const [baseURL, setBaseURL] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [label, setLabel] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const liveGatewayApi = useGatewayApiFor(useMemo(() => ({
        baseURL: baseURL.trim() || "http://127.0.0.1",
        username: username.trim(),
        password
    }), [baseURL, password, username]));

    useEffect(() => {
        setBaseURL(gateway?.baseURL ?? "");
        setUsername(gateway?.username ?? "");
        setPassword(gateway?.password ?? "");
        setLabel(gateway?.label ?? "");
    }, [gateway?.baseURL, gateway?.password, gateway?.username, gateway?.label]);

    const saveSettings = async () => {
        const nextBaseURL = baseURL.trim();
        if (!isValidHttpUrl(nextBaseURL)) {
            setError("Bitte eine gültige URL eingeben.");
            return;
        }

        setError("");
        setIsSaving(true);
        const nextGateway = {
            baseURL: nextBaseURL,
            username: username.trim(),
            password,
            label: label.trim()
        };

        try {
            const config = await queryClient.fetchQuery(
                liveGatewayApi.queryOptions("get", "/api/server", undefined, {staleTime: 0})
            ) as ConfigData;
            saveGatewayConfig({
                id: nextGateway.baseURL,
                username: nextGateway.username,
                password: nextGateway.password,
                label: nextGateway.label
            });
            updateServerConfig(config, nextGateway.baseURL);
            setGateway(nextGateway);
            setConfig(config);
            router.back();
        } catch {
            setError("Gateway konnte nicht erreicht werden.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppScreen title="Gateway" subtitle="Verbindungsdaten der aktiven Zentrale" scroll>
            <SurfaceCard>
                <FormField
                    label="Gateway-URL"
                    value={baseURL}
                    onChangeText={setBaseURL}
                    keyboardType="url"
                    placeholder="http://192.168.x.x"
                />
                <FormField
                    label="Benutzername"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="admin"
                />
                <FormField
                    label="Passwort"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="********"
                />
                <FormField
                    label="Anzeigename"
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Wohnung"
                    autoCapitalize="sentences"
                />
                {error ? <Text style={{color: "#b3384a", marginBottom: 10}}>{error}</Text> : null}
                <ActionButton title={isSaving ? "Speichere..." : "Speichern und Verbindung testen"} onPress={saveSettings} disabled={isSaving}/>
            </SurfaceCard>
        </AppScreen>
    );
}
