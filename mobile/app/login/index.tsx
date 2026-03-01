import {useMemo, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {router} from "expo-router";
import {saveGatewayConfig, updateServerConfig} from "@/utils/sqlite";
import {useContentModel} from "@/store/store";
import {isValidHttpUrl} from "@/utils/url";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {FormField} from "@/components/ui/FormField";
import {ActionButton} from "@/components/ui/ActionButton";
import {StatusPill} from "@/components/ui/StatusPill";
import {Colors} from "@/constants/Colors";
import {AuthMode, ConfigData} from "@/models/ConfigData";
import {resolveAuthMode} from "@/utils/authMode";
import {useGatewayApiFor} from "@/hooks/useGatewayApi";
import {useQueryClient} from "@tanstack/react-query";
import {clearAuthorizationHeader, setAuthorizationHeader} from "@/lib/openapi/authHeaderStore";
import {authenticateWithOidc, OidcAuthError} from "@/utils/oidcAuth";

type WizardAuthMode = "unknown" | AuthMode;

export default function LoginScreen() {
    const gateway = useContentModel((state) => state.gateway);
    const setGateway = useContentModel((state) => state.setGateway);
    const setConfig = useContentModel((state) => state.setConfig);
    const queryClient = useQueryClient();
    const [step, setStep] = useState<1 | 2>(1);
    const [authMode, setAuthMode] = useState<WizardAuthMode>("unknown");
    const [probedConfig, setProbedConfig] = useState<ConfigData | null>(null);
    const [baseURL, setBaseURL] = useState(gateway?.baseURL ?? "");
    const [username, setUsername] = useState(gateway?.username ?? "");
    const [password, setPassword] = useState(gateway?.password ?? "");
    const [label, setLabel] = useState(gateway?.label ?? "");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const probeApi = useGatewayApiFor(useMemo(() => ({
        baseURL: (baseURL ?? "").trim() || "http://127.0.0.1",
        username: "",
        password: ""
    }), [baseURL]));
    const activeApi = useGatewayApiFor(useMemo(() => ({
        baseURL: (baseURL ?? "").trim() || "http://127.0.0.1",
        username: username.trim(),
        password
    }), [baseURL, password, username]));
    const verifyBasicLoginMutation = activeApi.useMutation("post", "/login");

    const probeGateway = async () => {
        const normalizedBaseURL = (baseURL ?? "").trim();
        if (!isValidHttpUrl(normalizedBaseURL)) {
            setError("Bitte eine gültige URL mit http:// oder https:// eingeben.");
            return;
        }

        setError("");
        setIsLoading(true);
        try {
            const config = await queryClient.fetchQuery(
                probeApi.queryOptions("get", "/api/server", undefined, {staleTime: 0})
            ) as ConfigData;
            const detectedMode = resolveAuthMode(config);

            setProbedConfig(config);
            setAuthMode(detectedMode);
            setStep(2);

            if (detectedMode === "basic" && !username.trim()) {
                setUsername("admin");
            }
            if (detectedMode === "oidc") {
                setUsername("");
                setPassword("");
            }
        } catch {
            setError("Gateway konnte nicht erreicht werden. Bitte URL und Netzwerk prüfen.");
        } finally {
            setIsLoading(false);
        }
    };

    const connectGateway = async () => {
        const normalizedBaseURL = (baseURL ?? "").trim();
        if (!isValidHttpUrl(normalizedBaseURL)) {
            setError("Bitte eine gültige URL mit http:// oder https:// eingeben.");
            setStep(1);
            return;
        }

        if (authMode === "unknown") {
            setError("Bitte zuerst Schritt 1 abschließen.");
            setStep(1);
            return;
        }

        if (authMode === "oidc" && !probedConfig?.oidcConfig) {
            setError("OIDC-Konfiguration fehlt im Gateway-Setup.");
            return;
        }

        const normalizedUsername = username.trim();
        if (authMode === "basic" && (!normalizedUsername || !password)) {
            setError("Dieses Gateway verlangt Benutzername und Passwort.");
            return;
        }

        setError("");
        setIsLoading(true);
        const nextGateway = {
            baseURL: normalizedBaseURL,
            username: normalizedUsername,
            password,
            label: label.trim()
        };

        try {
            if (authMode === "basic") {
                clearAuthorizationHeader();
                await verifyBasicLoginMutation.mutateAsync({
                    body: {
                        username: nextGateway.username,
                        password: nextGateway.password
                    }
                });
            }
            if (authMode === "oidc") {
                const oidcConfig = probedConfig?.oidcConfig;
                if (!oidcConfig) {
                    throw new OidcAuthError("OIDC-Konfiguration fehlt im Gateway-Setup.");
                }

                const accessToken = await authenticateWithOidc(oidcConfig);
                setAuthorizationHeader(`Bearer ${accessToken}`);
                nextGateway.username = "";
                nextGateway.password = "";
                await queryClient.fetchQuery(
                    activeApi.queryOptions("get", "/status", undefined, {staleTime: 0})
                );
            }
            if (authMode === "none") {
                clearAuthorizationHeader();
            }

            const config = probedConfig ?? await queryClient.fetchQuery(
                probeApi.queryOptions("get", "/api/server", undefined, {staleTime: 0})
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
            router.replace("/main/devices/(tabs)");
        } catch (error) {
            if (authMode === "oidc") {
                clearAuthorizationHeader();
                if (error instanceof OidcAuthError) {
                    setError(error.message);
                    return;
                }
                setError("OIDC-Anmeldung oder Token-Prüfung ist fehlgeschlagen.");
                return;
            }
            if (authMode === "basic") {
                setError("Zugangsdaten ungültig. Bitte Benutzername und Passwort prüfen.");
                return;
            }
            setError("Verbindung fehlgeschlagen. URL oder Zugangsdaten prüfen.");
        } finally {
            setIsLoading(false);
        }
    };

    const stepDescription = authMode === "basic"
        ? "Auth-Mode ist Basic. Benutzername und Passwort sind erforderlich."
        : authMode === "oidc"
            ? "Auth-Mode ist OIDC. Die Anmeldung erfolgt über den Identity Provider des Gateways."
            : "Auth-Mode ist None. Du kannst ohne Benutzername und Passwort verbinden.";
    const primaryActionTitle = authMode === "oidc"
        ? (isLoading ? "OIDC-Anmeldung..." : "Mit OIDC anmelden und verbinden")
        : (isLoading ? "Verbinde..." : "Verbinden");

    return (
        <AppScreen
            title="Livisi Gateway"
            subtitle="Verbinde dein lokales Gateway Schritt für Schritt."
            scroll
        >
            <SurfaceCard style={{marginBottom: 14}}>
                <Text style={styles.stepMeta}>Schritt {step} von 2</Text>
                <View style={styles.stepRow}>
                    <View style={[styles.stepBar, styles.stepBarActive]}/>
                    <View style={[styles.stepBar, step === 2 ? styles.stepBarActive : null]}/>
                </View>

                {step === 1 ? (
                    <>
                        <Text style={styles.helperText}>
                            Wir prüfen zuerst nur die Gateway-URL. Danach weißt du, ob Zugangsdaten benötigt werden.
                        </Text>
                        <FormField
                            label="Gateway-URL"
                            value={baseURL}
                            onChangeText={(value) => {
                                setError("");
                                setBaseURL(value);
                                setProbedConfig(null);
                                setAuthMode("unknown");
                            }}
                            placeholder="http://192.168.x.x"
                            keyboardType="url"
                            autoCapitalize="none"
                        />
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        <ActionButton title={isLoading ? "Prüfe..." : "Gateway prüfen"} onPress={probeGateway} disabled={isLoading}/>
                    </>
                ) : (
                    <>
                        <View style={styles.gatewayInfo}>
                            <Text style={styles.gatewayLabel}>Gateway</Text>
                            <Text style={styles.gatewayValue}>{baseURL.trim()}</Text>
                        </View>

                        <StatusPill
                            label={
                                authMode === "basic"
                                    ? "Auth-Mode: Basic"
                                    : authMode === "oidc"
                                        ? "Auth-Mode: OIDC"
                                        : "Auth-Mode: None"
                            }
                            tone={authMode === "basic" ? "warning" : authMode === "oidc" ? "primary" : "success"}
                        />
                        <Text style={styles.helperText}>{stepDescription}</Text>

                        {authMode === "oidc" ? (
                            <>
                                <Text style={styles.oidcHint}>
                                    Du wirst im nächsten Schritt zur OIDC-Anmeldung weitergeleitet.
                                </Text>
                                <FormField
                                    label="Anzeigename (optional)"
                                    value={label}
                                    onChangeText={setLabel}
                                    placeholder="Zuhause"
                                    autoCapitalize="sentences"
                                />
                            </>
                        ) : (
                            <>
                                <FormField
                                    label={authMode === "basic" ? "Benutzername" : "Benutzername (optional)"}
                                    value={username}
                                    onChangeText={(value) => {
                                        setError("");
                                        setUsername(value);
                                    }}
                                    placeholder="admin"
                                    autoCapitalize="none"
                                />
                                <FormField
                                    label={authMode === "basic" ? "Passwort" : "Passwort (optional)"}
                                    value={password}
                                    onChangeText={(value) => {
                                        setError("");
                                        setPassword(value);
                                    }}
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
                            </>
                        )}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        <View style={styles.secondaryActions}>
                            <ActionButton
                                title={primaryActionTitle}
                                onPress={connectGateway}
                                disabled={isLoading}
                            />
                            <ActionButton
                                title="Zurück zur URL"
                                onPress={() => {
                                    setStep(1);
                                    setError("");
                                    setIsLoading(false);
                                }}
                                variant="ghost"
                                disabled={isLoading}
                            />
                        </View>
                    </>
                )}
            </SurfaceCard>

            <SurfaceCard muted>
                <Text style={styles.optionsTitle}>Weitere Optionen</Text>
                <View style={styles.secondaryActions}>
                    <ActionButton title="Gespeicherte Gateways" onPress={() => router.push("/login/smarthomeSelection")} variant="ghost"/>
                    <ActionButton title="Neues Gateway anlegen" onPress={() => router.push("/login/SmarthomeDetailAdd")} variant="ghost"/>
                </View>
            </SurfaceCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    stepMeta: {
        color: Colors.app.textMuted,
        fontWeight: "600",
        fontSize: 12,
        marginBottom: 8
    },
    stepRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12
    },
    stepBar: {
        flex: 1,
        height: 6,
        borderRadius: 999,
        backgroundColor: Colors.app.surfaceSoft
    },
    stepBarActive: {
        backgroundColor: Colors.app.primary
    },
    helperText: {
        color: Colors.app.textMuted,
        marginBottom: 12,
        lineHeight: 20
    },
    gatewayInfo: {
        marginBottom: 10
    },
    gatewayLabel: {
        color: Colors.app.textMuted,
        fontSize: 12,
        fontWeight: "600"
    },
    gatewayValue: {
        color: Colors.app.text,
        fontSize: 15,
        fontWeight: "700",
        marginTop: 2
    },
    errorText: {
        color: "#b3384a",
        marginBottom: 10
    },
    secondaryActions: {
        gap: 10
    },
    optionsTitle: {
        color: Colors.app.text,
        fontWeight: "700",
        marginBottom: 8
    },
    oidcHint: {
        color: Colors.app.textMuted,
        marginBottom: 12
    }
});
