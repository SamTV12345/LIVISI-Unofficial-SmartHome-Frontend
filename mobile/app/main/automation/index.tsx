import {useCallback, useEffect, useMemo, useState} from "react";
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {router} from "expo-router";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {ActionButton} from "@/components/ui/ActionButton";
import {StatusPill} from "@/components/ui/StatusPill";
import {ErrorBanner} from "@/components/ErrorBanner";
import {Colors} from "@/constants/Colors";
import {useContentModel} from "@/store/store";
import {Interaction} from "@/models/Interaction";
import {
    buildAutomationPresentationLookup,
    readAutomationCategory,
    readAutomationState,
    summarizeInteraction
} from "@/utils/automationPresentation";
import {formatTime} from "@/utils/timeUtils";
import {useGatewayApi} from "@/hooks/useGatewayApi";

const ALL_CATEGORIES = "Alle Kategorien";

export default function AutomationScreen() {
    const gateway = useContentModel((state) => state.gateway);
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const gatewayApi = useGatewayApi();
    const interactionsQuery = gatewayApi.useQuery("get", "/interaction", undefined, {
        enabled: Boolean(gateway?.baseURL)
    });
    const triggerInteractionMutation = gatewayApi.useMutation("post", "/interaction/{id}/trigger");

    const [refreshing, setRefreshing] = useState(false);
    const [syncPending, setSyncPending] = useState(false);
    const [activeInteractionId, setActiveInteractionId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!interactionsQuery.data) {
            return;
        }

        const nextInteractions = interactionsQuery.data as Interaction[];
        const currentState = useContentModel.getState().allThings;
        if (currentState) {
            setAllThings({
                ...currentState,
                interactions: nextInteractions
            });
        }
    }, [interactionsQuery.data, setAllThings]);

    const interactions = useMemo(() => {
        const data = (interactionsQuery.data as Interaction[] | undefined) ?? allThings?.interactions ?? [];
        return [...data].sort((left, right) => (left.name ?? left.id).localeCompare(right.name ?? right.id));
    }, [allThings?.interactions, interactionsQuery.data]);

    const presentationLookup = useMemo(() => {
        return buildAutomationPresentationLookup(allThings);
    }, [allThings]);

    const categories = useMemo(() => {
        const unique = new Set<string>();
        for (const interaction of interactions) {
            unique.add(readAutomationCategory(interaction));
        }
        return [ALL_CATEGORIES, ...Array.from(unique).sort((left, right) => left.localeCompare(right, "de"))];
    }, [interactions]);

    const filteredInteractions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return interactions.filter((interaction) => {
            const category = readAutomationCategory(interaction);
            const matchesCategory = selectedCategory === ALL_CATEGORIES || selectedCategory === category;
            if (!matchesCategory) {
                return false;
            }

            if (normalizedSearch.length === 0) {
                return true;
            }

            const name = (interaction.name ?? "").toLowerCase();
            const description = (interaction.tags?.description ?? "").toLowerCase();
            const id = interaction.id.toLowerCase();
            return name.includes(normalizedSearch) || description.includes(normalizedSearch) || id.includes(normalizedSearch);
        });
    }, [interactions, searchTerm, selectedCategory]);

    const aggregatedStats = useMemo(() => {
        return filteredInteractions.reduce((stats, interaction) => {
            const summary = summarizeInteraction(interaction, presentationLookup);
            stats.rules += summary.totalRuleCount;
            stats.triggers += summary.totalTriggerCount;
            stats.actions += summary.totalActionCount;
            return stats;
        }, {rules: 0, triggers: 0, actions: 0});
    }, [filteredInteractions, presentationLookup]);

    const syncInteractions = useCallback(async () => {
        if (!gateway?.baseURL || syncPending) {
            return;
        }

        setSyncPending(true);
        try {
            const result = await interactionsQuery.refetch();
            const nextInteractions = (result.data as Interaction[] | undefined) ?? [];
            const currentState = useContentModel.getState().allThings;
            if (currentState) {
                setAllThings({
                    ...currentState,
                    interactions: nextInteractions
                });
            }
            setError(undefined);
        } catch {
            setError("Automationen konnten nicht synchronisiert werden.");
        } finally {
            setSyncPending(false);
        }
    }, [gateway?.baseURL, interactionsQuery, setAllThings, syncPending]);

    const refreshAll = useCallback(async () => {
        if (refreshing) {
            return;
        }
        setRefreshing(true);
        await syncInteractions();
        setRefreshing(false);
    }, [refreshing, syncInteractions]);

    useEffect(() => {
        if (!allThings?.interactions && gateway?.baseURL) {
            void syncInteractions();
        }
    }, [allThings?.interactions, gateway?.baseURL, syncInteractions]);

    const openDetails = (interactionId: string) => {
        router.push({
            pathname: "/main/automation/[interactionId]",
            params: {
                interactionId
            }
        });
    };

    const runInteraction = async (interaction: Interaction) => {
        if (!gateway?.baseURL || activeInteractionId === interaction.id) {
            return;
        }

        setActiveInteractionId(interaction.id);
        try {
            await triggerInteractionMutation.mutateAsync({
                params: {
                    path: {
                        id: interaction.id
                    }
                }
            });
            setError(undefined);
        } catch {
            setError("Automation konnte nicht ausgeloest werden.");
        } finally {
            setActiveInteractionId(undefined);
        }
    };

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAll();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title="Automation"
                    subtitle="Livisi-Interaktionen filtern, pruefen und direkt ausfuehren."
                    badges={[
                        {
                            label: `${filteredInteractions.length} Automationen`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="source-branch"/>
                        },
                        {
                            label: `${aggregatedStats.rules} Regeln`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="shape-outline"/>
                        },
                        {
                            label: `${aggregatedStats.actions} Aktionen`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="flash-outline"/>
                        }
                    ]}
                    stats={[
                        {label: "Gefiltert", value: filteredInteractions.length},
                        {label: "Trigger", value: aggregatedStats.triggers},
                        {label: "Aktionen", value: aggregatedStats.actions},
                        {label: "Kategorien", value: Math.max(0, categories.length - 1)}
                    ]}
                    actionSlot={
                        <Pressable
                            onPress={() => {
                                void syncInteractions();
                            }}
                            style={({pressed}) => [
                                styles.syncButton,
                                pressed ? {opacity: 0.8} : null
                            ]}
                            disabled={syncPending}
                        >
                            <Text style={styles.syncButtonLabel}>{syncPending ? "Sync..." : "Sync"}</Text>
                        </Pressable>
                    }
                />

                {error ? <ErrorBanner message={error}/> : null}

                <ModernSection
                    title="Filter"
                    description="Suche und Kategorien"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="filter-variant"/>}
                    style={{marginBottom: 14}}
                >
                    <TextInput
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholder="Name, Beschreibung oder ID"
                        placeholderTextColor={Colors.app.textMuted}
                        style={styles.searchInput}
                    />
                    <View style={styles.chipWrap}>
                        {categories.map((category) => {
                            const selected = selectedCategory === category;
                            return (
                                <Pressable
                                    key={category}
                                    onPress={() => setSelectedCategory(category)}
                                    style={[styles.chip, selected ? styles.chipSelected : null]}
                                >
                                    <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                                        {category}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </ModernSection>

                <ModernSection
                    title="Automationen"
                    description="Jetzt ausfuehren oder Details oeffnen"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="playlist-play"/>}
                    style={{marginBottom: 14}}
                >
                    {filteredInteractions.length === 0 && (
                        <Text style={styles.emptyText}>Keine passenden Automationen gefunden.</Text>
                    )}
                    {filteredInteractions.map((interaction, index) => {
                        const summary = summarizeInteraction(interaction, presentationLookup);
                        const category = readAutomationCategory(interaction);
                        const state = readAutomationState(interaction);
                        const isRunning = activeInteractionId === interaction.id;

                        return (
                            <View
                                key={interaction.id}
                                style={[
                                    styles.interactionCard,
                                    index < filteredInteractions.length - 1 ? styles.interactionCardWithGap : null
                                ]}
                            >
                                <View style={styles.cardHeaderRow}>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.interactionTitle}>{interaction.name ?? interaction.id}</Text>
                                        <Text style={styles.interactionMeta}>
                                            {category} · {formatTime(interaction.modified)}
                                        </Text>
                                    </View>
                                    <StatusPill
                                        label={state}
                                        tone={state === "Aktiv" ? "success" : state === "Inaktiv" ? "warning" : "neutral"}
                                    />
                                </View>

                                <View style={styles.ruleStatRow}>
                                    <Text style={styles.ruleStatText}>{summary.totalRuleCount} Regeln</Text>
                                    <Text style={styles.ruleStatText}>{summary.totalTriggerCount} Trigger</Text>
                                    <Text style={styles.ruleStatText}>{summary.totalActionCount} Aktionen</Text>
                                </View>

                                {summary.rulePreviews.slice(0, 1).map((preview, previewIndex) => (
                                    <View key={`${interaction.id}-${previewIndex}`} style={styles.previewCard}>
                                        <Text style={styles.previewLabel}>Wenn</Text>
                                        <View style={styles.previewChipWrap}>
                                            {(preview.whenChips.length > 0 ? preview.whenChips : ["Kein Trigger"]).slice(0, 4).map((chip) => (
                                                <View key={`${interaction.id}-when-${chip}`} style={styles.previewChip}>
                                                    <Text style={styles.previewChipLabel}>{chip}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <Text style={[styles.previewLabel, {marginTop: 8}]}>Dann</Text>
                                        <View style={styles.previewChipWrap}>
                                            {(preview.thenChips.length > 0 ? preview.thenChips : ["Keine Aktion"]).slice(0, 4).map((chip) => (
                                                <View key={`${interaction.id}-then-${chip}`} style={[styles.previewChip, styles.previewChipSecondary]}>
                                                    <Text style={[styles.previewChipLabel, styles.previewChipLabelSecondary]}>{chip}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ))}

                                <View style={styles.cardActions}>
                                    <ActionButton
                                        title={isRunning ? "Wird ausgefuehrt..." : "Jetzt ausfuehren"}
                                        onPress={() => {
                                            void runInteraction(interaction);
                                        }}
                                        disabled={isRunning}
                                    />
                                    <View style={{height: 8}}/>
                                    <ActionButton
                                        title="Details"
                                        onPress={() => openDetails(interaction.id)}
                                        variant="ghost"
                                    />
                                </View>
                            </View>
                        );
                    })}
                </ModernSection>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    syncButton: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.45)",
        backgroundColor: "rgba(255,255,255,0.16)",
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    syncButtonLabel: {
        color: "white",
        fontSize: 12,
        fontWeight: "700"
    },
    searchInput: {
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 12,
        backgroundColor: Colors.app.surfaceSoft,
        color: Colors.app.text,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    chip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.app.border,
        backgroundColor: Colors.app.surfaceSoft,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    chipSelected: {
        borderColor: Colors.app.primary,
        backgroundColor: Colors.app.primarySoft
    },
    chipLabel: {
        color: Colors.app.textMuted,
        fontSize: 12,
        fontWeight: "600"
    },
    chipLabelSelected: {
        color: Colors.app.primary
    },
    emptyText: {
        color: Colors.app.textMuted
    },
    interactionCard: {
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 14,
        backgroundColor: Colors.app.surfaceSoft,
        padding: 12
    },
    interactionCardWithGap: {
        marginBottom: 10
    },
    cardHeaderRow: {
        flexDirection: "row",
        gap: 10
    },
    interactionTitle: {
        color: Colors.app.text,
        fontSize: 16,
        fontWeight: "700"
    },
    interactionMeta: {
        marginTop: 2,
        color: Colors.app.textMuted,
        fontSize: 12
    },
    ruleStatRow: {
        marginTop: 8,
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap"
    },
    ruleStatText: {
        fontSize: 12,
        color: Colors.app.textMuted,
        backgroundColor: Colors.app.surface,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    previewCard: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 12,
        backgroundColor: Colors.app.surface,
        padding: 10
    },
    previewLabel: {
        color: Colors.app.primary,
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase"
    },
    previewChipWrap: {
        marginTop: 5,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6
    },
    previewChip: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#bee1ff",
        backgroundColor: "#eef7ff",
        paddingHorizontal: 7,
        paddingVertical: 4
    },
    previewChipSecondary: {
        borderColor: "#cfeadf",
        backgroundColor: "#effaf4"
    },
    previewChipLabel: {
        color: "#28638d",
        fontSize: 11
    },
    previewChipLabelSecondary: {
        color: "#2f7f58"
    },
    cardActions: {
        marginTop: 10
    }
});
