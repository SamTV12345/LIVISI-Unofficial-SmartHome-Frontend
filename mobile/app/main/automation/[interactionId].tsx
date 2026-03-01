import {useCallback, useEffect, useMemo, useState} from "react";
import {RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {ActionButton} from "@/components/ui/ActionButton";
import {ErrorBanner} from "@/components/ErrorBanner";
import {StatusPill} from "@/components/ui/StatusPill";
import {Colors} from "@/constants/Colors";
import {fetchInteractionById, triggerInteraction} from "@/lib/api";
import {useContentModel} from "@/store/store";
import {Interaction} from "@/models/Interaction";
import {
    buildAutomationPresentationLookup,
    readAutomationCategory,
    readAutomationState,
    summarizeInteraction
} from "@/utils/automationPresentation";
import {formatTime} from "@/utils/timeUtils";

export default function AutomationDetailScreen() {
    const {interactionId} = useLocalSearchParams<{interactionId: string}>();
    const gateway = useContentModel((state) => state.gateway);
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);

    const [interaction, setInteraction] = useState<Interaction | undefined>(undefined);
    const [refreshing, setRefreshing] = useState(false);
    const [triggerPending, setTriggerPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

    const presentationLookup = useMemo(() => {
        return buildAutomationPresentationLookup(allThings);
    }, [allThings]);

    const summary = useMemo(() => {
        if (!interaction) {
            return {
                rulePreviews: [],
                totalRuleCount: 0,
                totalTriggerCount: 0,
                totalActionCount: 0
            };
        }
        return summarizeInteraction(interaction, presentationLookup);
    }, [interaction, presentationLookup]);

    const category = interaction ? readAutomationCategory(interaction) : "-";
    const state = interaction ? readAutomationState(interaction) : "Unbekannt";

    const saveInteractionIntoStore = useCallback((nextInteraction: Interaction) => {
        const currentState = useContentModel.getState().allThings;
        if (!currentState) {
            return;
        }
        const currentInteractions = currentState.interactions ?? [];
        const nextInteractions = currentInteractions.some((entry) => entry.id === nextInteraction.id)
            ? currentInteractions.map((entry) => entry.id === nextInteraction.id ? nextInteraction : entry)
            : [...currentInteractions, nextInteraction];
        setAllThings({
            ...currentState,
            interactions: nextInteractions
        });
    }, [setAllThings]);

    const loadInteraction = useCallback(async () => {
        if (!gateway?.baseURL || !interactionId) {
            return;
        }

        setRefreshing(true);
        try {
            const nextInteraction = await fetchInteractionById(gateway, interactionId);
            setInteraction(nextInteraction);
            saveInteractionIntoStore(nextInteraction);
            setError(undefined);
        } catch {
            setError("Details konnten nicht geladen werden.");
        } finally {
            setRefreshing(false);
        }
    }, [gateway, interactionId, saveInteractionIntoStore]);

    useEffect(() => {
        void loadInteraction();
    }, [loadInteraction]);

    const onTrigger = async () => {
        if (!gateway?.baseURL || !interaction?.id || triggerPending) {
            return;
        }

        setTriggerPending(true);
        try {
            await triggerInteraction(gateway, interaction.id);
            setSuccessMessage("Automation wurde ausgefuehrt.");
            setError(undefined);
        } catch {
            setError("Automation konnte nicht ausgeloest werden.");
            setSuccessMessage(undefined);
        } finally {
            setTriggerPending(false);
        }
    };

    if (!interactionId) {
        return (
            <AppScreen title="Automation" subtitle="Keine Automation-ID uebergeben.">
                <ErrorBanner message="Automation-ID fehlt."/>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void loadInteraction();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title={interaction?.name ?? interactionId}
                    subtitle={interaction ? "Details zur ausgewaehlten Livisi-Automation." : "Lade Automationsdetails..."}
                    badges={[
                        {
                            label: category,
                            icon: <MaterialCommunityIcons size={12} color="white" name="shape-outline"/>
                        },
                        {
                            label: state,
                            icon: <MaterialCommunityIcons size={12} color="white" name="toggle-switch-outline"/>
                        }
                    ]}
                    stats={[
                        {label: "Regeln", value: summary.totalRuleCount},
                        {label: "Trigger", value: summary.totalTriggerCount},
                        {label: "Aktionen", value: summary.totalActionCount},
                        {label: "Geaendert", value: interaction ? formatTime(interaction.modified) : "-"}
                    ]}
                />

                {error ? <ErrorBanner message={error}/> : null}
                {successMessage ? (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>{successMessage}</Text>
                    </View>
                ) : null}

                <ModernSection
                    title="Status"
                    description="Aktueller Zustand und zentrale Aktionen"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="information-outline"/>}
                    style={{marginBottom: 14}}
                >
                    <View style={{gap: 8}}>
                        <StatusPill
                            label={state}
                            tone={state === "Aktiv" ? "success" : state === "Inaktiv" ? "warning" : "neutral"}
                        />
                        <Text style={styles.metaLine}>ID: {interaction?.id ?? interactionId}</Text>
                        <Text style={styles.metaLine}>Zuletzt geaendert: {interaction ? formatTime(interaction.modified) : "-"}</Text>
                    </View>
                    <View style={{marginTop: 10}}>
                        <ActionButton
                            title={triggerPending ? "Wird ausgefuehrt..." : "Jetzt ausfuehren"}
                            onPress={() => {
                                void onTrigger();
                            }}
                            disabled={triggerPending || !interaction}
                        />
                    </View>
                </ModernSection>

                <ModernSection
                    title="Regelvorschau"
                    description="Wenn-Dann Uebersicht"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="format-list-checks"/>}
                    style={{marginBottom: 14}}
                >
                    {summary.rulePreviews.length === 0 && (
                        <Text style={styles.metaLine}>Keine Regeln gefunden.</Text>
                    )}
                    {summary.rulePreviews.map((preview, index) => (
                        <View key={`rule-${index}`} style={[styles.ruleCard, index > 0 ? {marginTop: 8} : null]}>
                            <Text style={styles.ruleLabel}>Wenn</Text>
                            <View style={styles.chipWrap}>
                                {(preview.whenChips.length > 0 ? preview.whenChips : ["Kein Trigger"]).slice(0, 8).map((chip) => (
                                    <View key={`when-${index}-${chip}`} style={styles.chipWhen}>
                                        <Text style={styles.chipWhenText}>{chip}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={[styles.ruleLabel, {marginTop: 8}]}>Dann</Text>
                            <View style={styles.chipWrap}>
                                {(preview.thenChips.length > 0 ? preview.thenChips : ["Keine Aktion"]).slice(0, 8).map((chip) => (
                                    <View key={`then-${index}-${chip}`} style={styles.chipThen}>
                                        <Text style={styles.chipThenText}>{chip}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ModernSection>

                <ModernSection
                    title="Raw JSON"
                    description="Technische Ansicht fuer Debugging"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="code-json"/>}
                    style={{marginBottom: 14}}
                >
                    <Text style={styles.rawJsonText}>{JSON.stringify(interaction, null, 2)}</Text>
                </ModernSection>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    successBanner: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#bde8d0",
        backgroundColor: "#e8f8ef",
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12
    },
    successText: {
        color: "#2f7f58",
        fontWeight: "600"
    },
    metaLine: {
        color: Colors.app.textMuted,
        lineHeight: 20
    },
    ruleCard: {
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 12,
        backgroundColor: Colors.app.surfaceSoft,
        padding: 10
    },
    ruleLabel: {
        color: Colors.app.text,
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase"
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 5
    },
    chipWhen: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#bee1ff",
        backgroundColor: "#eef7ff",
        paddingHorizontal: 7,
        paddingVertical: 4
    },
    chipWhenText: {
        color: "#28638d",
        fontSize: 11
    },
    chipThen: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#cfeadf",
        backgroundColor: "#effaf4",
        paddingHorizontal: 7,
        paddingVertical: 4
    },
    chipThenText: {
        color: "#2f7f58",
        fontSize: 11
    },
    rawJsonText: {
        color: Colors.app.text,
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 18
    }
});
