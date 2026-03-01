import {useMemo, useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {FormField} from "@/components/ui/FormField";
import {ActionButton} from "@/components/ui/ActionButton";
import {isValidHttpUrl} from "@/utils/url";
import {saveGatewayConfig, updateServerConfig} from "@/utils/sqlite";
import {resolveAuthMode} from "@/utils/authMode";
import {useGatewayApiFor} from "@/hooks/useGatewayApi";
import {useQueryClient} from "@tanstack/react-query";
import {ConfigData} from "@/models/ConfigData";
import {clearAuthorizationHeader, setAuthorizationHeader} from "@/lib/openapi/authHeaderStore";
import {authenticateWithOidc, OidcAuthError} from "@/utils/oidcAuth";

export default function SmarthomeDetailAdd() {
    const queryClient = useQueryClient();
    const [baseURL, setBaseURL] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [label, setLabel] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const probeApi = useGatewayApiFor(useMemo(() => ({
        baseURL: baseURL.trim() || "http://127.0.0.1",
        username: "",
        password: ""
    }), [baseURL]));
    const activeApi = useGatewayApiFor(useMemo(() => ({
        baseURL: baseURL.trim() || "http://127.0.0.1",
        username: username.trim(),
        password
    }), [baseURL, password, username]));
    const verifyBasicLoginMutation = activeApi.useMutation("post", "/login");

    const onSave = async () => {
        const nextBaseURL = baseURL.trim();
        if (!isValidHttpUrl(nextBaseURL)) {
            setError("URL ist nicht gültig.");
            return;
        }

        setIsSaving(true);
        setError("");
        let detectedAuthMode: ReturnType<typeof resolveAuthMode> | "unknown" = "unknown";
        try {
            const config = await queryClient.fetchQuery(
                probeApi.queryOptions("get", "/api/server", undefined, {staleTime: 0})
            ) as ConfigData;
            detectedAuthMode = resolveAuthMode(config);

            const gateway = {
                baseURL: nextBaseURL,
                username: username.trim(),
                password,
                label: label.trim()
            };

            if (detectedAuthMode === "oidc" && !config.oidcConfig) {
                setError("OIDC-Konfiguration fehlt im Gateway-Setup.");
                return;
            }

            if (detectedAuthMode === "basic") {
                clearAuthorizationHeader();
                if (!gateway.username || !gateway.password) {
                    setError("Dieses Gateway verlangt Benutzername und Passwort.");
                    return;
                }
                await verifyBasicLoginMutation.mutateAsync({
                    body: {
                        username: gateway.username,
                        password: gateway.password
                    }
                });
            }

            if (detectedAuthMode === "oidc") {
                const oidcConfig = config.oidcConfig;
                if (!oidcConfig) {
                    throw new OidcAuthError("OIDC-Konfiguration fehlt im Gateway-Setup.");
                }

                const accessToken = await authenticateWithOidc(oidcConfig);
                setAuthorizationHeader(`Bearer ${accessToken}`);
                gateway.username = "";
                gateway.password = "";
                await queryClient.fetchQuery(
                    activeApi.queryOptions("get", "/status", undefined, {staleTime: 0})
                );
            } else {
                clearAuthorizationHeader();
            }

            saveGatewayConfig({
                id: gateway.baseURL,
                username: gateway.username,
                password: gateway.password,
                label: gateway.label
            });
            updateServerConfig(config, gateway.baseURL);
            router.replace("/login/smarthomeSelection");
        } catch (error) {
            if (error instanceof OidcAuthError) {
                clearAuthorizationHeader();
                setError(error.message);
                return;
            }

            if (detectedAuthMode === "oidc") {
                clearAuthorizationHeader();
                setError("OIDC-Anmeldung oder Token-Prüfung ist fehlgeschlagen.");
                return;
            }

            if (username.trim() || password) {
                setError("Zugangsdaten ungültig.");
                return;
            }
            setError("Server nicht erreichbar oder Gateway antwortet nicht.");
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
