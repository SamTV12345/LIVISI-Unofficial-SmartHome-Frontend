import {useEffect, useMemo, useState} from "react";
import {RefreshControl, ScrollView, StyleSheet, Text, TextInput} from "react-native";
import {useContentModel, type EmailConfig} from "@/store/store";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {FormField} from "@/components/ui/FormField";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {Colors} from "@/constants/Colors";

const emptyConfig: EmailConfig = {
    server_address: "",
    server_port_number: 0,
    email_username: "",
    email_password: "",
    recipient_list: [],
    notifications_device_unreachable: true,
    notification_device_low_battery: true
};

const parseRecipients = (value: string): string[] => {
    return value
        .split(/[,\n;]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
};

export default function EmailSettingsScreen() {
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const [emailConfig, setEmailConfig] = useState<EmailConfig>(emptyConfig);
    const recipientsText = useMemo(() => emailConfig.recipient_list.join(", "), [emailConfig.recipient_list]);

    useEffect(() => {
        if (!allThings?.email) {
            return;
        }
        setEmailConfig(allThings.email);
    }, [allThings?.email]);

    const updateEmailConfig = (nextConfig: EmailConfig) => {
        setEmailConfig(nextConfig);
        if (!allThings) {
            return;
        }
        setAllThings({
            ...allThings,
            email: nextConfig
        });
    };

    const setField = <T extends keyof EmailConfig>(field: T, value: EmailConfig[T]) => {
        updateEmailConfig({
            ...emailConfig,
            [field]: value
        });
    };

    return (
        <AppScreen title="E-Mail" subtitle="SMTP-Konfiguration des Gateways" scroll={false}>
            <ScrollView
                overScrollMode="never"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}
                {!allThings?.email && <ErrorBanner message="E-Mail-Konfiguration wird geladen."/>}

                <SurfaceCard muted style={{marginBottom: 14}}>
                    <Text style={styles.infoText}>
                        Das Gateway sendet Benachrichtigungen direkt per SMTP. Trage hier die Daten deines Providers ein.
                        Speichern erfolgt über den Header-Button.
                    </Text>
                </SurfaceCard>

                <SectionHeader title="SMTP"/>
                <SurfaceCard style={{marginBottom: 14}}>
                    <FormField
                        label="SMTP-Server"
                        value={emailConfig.server_address}
                        onChangeText={(value) => setField("server_address", value)}
                        placeholder="smtp.example.org"
                    />
                    <FormField
                        label="SMTP-Port"
                        value={String(emailConfig.server_port_number || "")}
                        onChangeText={(value) => setField("server_port_number", Number.parseInt(value, 10) || 0)}
                        placeholder="465"
                        keyboardType="number-pad"
                    />
                    <FormField
                        label="Benutzername"
                        value={emailConfig.email_username}
                        onChangeText={(value) => setField("email_username", value)}
                        placeholder="dein.name@example.org"
                    />
                    <FormField
                        label="Passwort"
                        value={emailConfig.email_password}
                        onChangeText={(value) => setField("email_password", value)}
                        secureTextEntry
                        placeholder="********"
                    />
                </SurfaceCard>

                <SectionHeader title="Empfänger"/>
                <SurfaceCard>
                    <Text style={styles.fieldLabel}>Empfänger (Komma, Semikolon oder Zeilenumbruch)</Text>
                    <TextInput
                        value={recipientsText}
                        onChangeText={(value) => setField("recipient_list", parseRecipients(value))}
                        multiline
                        placeholder="mail1@example.org, mail2@example.org"
                        placeholderTextColor={Colors.app.textMuted}
                        style={styles.textArea}
                    />
                </SurfaceCard>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    infoText: {
        color: Colors.app.text,
        lineHeight: 21
    },
    fieldLabel: {
        color: Colors.app.text,
        fontWeight: "600",
        marginBottom: 6
    },
    textArea: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.app.surfaceSoft,
        color: Colors.app.text,
        textAlignVertical: "top"
    }
});
