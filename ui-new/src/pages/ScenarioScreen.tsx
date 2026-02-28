import {useCallback, useEffect, useMemo, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Interaction} from "@/src/models/Interaction.ts";
import axios, {AxiosResponse} from "axios";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useNavigate} from "react-router-dom";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bolt, Layers, Settings2} from "lucide-react";
import {formatTime} from "@/src/utils/timeUtils.ts";

export const ScenarioScreen = () => {
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [activeInteractionId, setActiveInteractionId] = useState<string | undefined>(undefined);
    const [actionError, setActionError] = useState<string | undefined>(undefined);
    const [refreshPending, setRefreshPending] = useState(false);
    const navigate = useNavigate();

    const sortedInteractions = useMemo(() => {
        return [...interactions].sort((a, b) => (a.name ?? a.id).localeCompare((b.name ?? b.id)));
    }, [interactions]);

    const totalActionCount = useMemo(() => {
        return sortedInteractions.reduce((count, interaction) => count + (interaction.rules?.reduce((ruleCount, rule) => ruleCount + (rule.actions?.length ?? 0), 0) ?? 0), 0);
    }, [sortedInteractions]);

    const loadInteractions = useCallback(() => {
        if (allThings?.interactions) {
            setInteractions(allThings.interactions);
            setLoading(false);
            setError(undefined);
            return;
        }

        setLoading(true);
        setError(undefined);
        axios.get("/interaction")
            .then((response: AxiosResponse<Interaction[]>) => {
                setInteractions(response.data ?? []);
            })
            .catch(() => {
                setError("Szenarien konnten nicht geladen werden.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [allThings?.interactions]);

    const triggerInteraction = useCallback(async (interactionId: string) => {
        setActionError(undefined);
        setActiveInteractionId(interactionId);
        try {
            await axios.post(`/interaction/${interactionId}/trigger`);
        } catch (triggerError) {
            console.error("Could not trigger interaction", triggerError);
            setActionError("Szenario konnte nicht ausgelöst werden.");
        } finally {
            setActiveInteractionId(undefined);
        }
    }, []);

    const refreshFromBackend = useCallback(async () => {
        setRefreshPending(true);
        try {
            const response = await axios.get<Interaction[]>("/interaction");
            const nextInteractions = response.data ?? [];
            setInteractions(nextInteractions);

            const latestAllThings = useContentModel.getState().allThings;
            if (latestAllThings) {
                setAllThings({
                    ...latestAllThings,
                    interactions: nextInteractions
                });
            }
            setActionError(undefined);
        } catch (refreshError) {
            console.error("Could not refresh interactions", refreshError);
            setActionError("Szenarien konnten nicht aktualisiert werden.");
        } finally {
            setRefreshPending(false);
        }
    }, [setAllThings]);

    useEffect(() => {
        loadInteractions();
    }, [loadInteractions]);

    return <PageComponent title="Szenarien">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="Szenarien"
                subtitle="Automationen verwalten, auslösen und bearbeiten."
                badges={[
                    {label: `${sortedInteractions.length} Szenarien`, icon: <Layers size={14}/>},
                    {label: `${totalActionCount} Aktionen`, icon: <Bolt size={14}/>}
                ]}
                actionSlot={
                    <div className="min-w-[170px]">
                        <PrimaryButton
                            filled
                            disabled={refreshPending}
                            onClick={() => {
                                void refreshFromBackend();
                            }}
                            className="bg-white/15 border-white/40 text-white hover:bg-white/25"
                        >
                            {refreshPending ? "Aktualisiert..." : "Neu laden"}
                        </PrimaryButton>
                    </div>
                }
                stats={[
                    {label: "Szenarien", value: sortedInteractions.length},
                    {label: "Aktionen", value: totalActionCount},
                    {label: "Status", value: loading ? "Lädt" : "Bereit"},
                    {label: "Fehler", value: error || actionError ? "Ja" : "Nein"}
                ]}
            />

            {loading && <ModernSection title="Lade Szenarien" description="Bitte warten..."><div className="text-sm text-gray-500">Szenarien werden geladen.</div></ModernSection>}
            {!loading && error && (
                <ModernSection title="Fehler" description={error}>
                    <div className="max-w-[220px]">
                        <PrimaryButton filled onClick={loadInteractions}>Erneut versuchen</PrimaryButton>
                    </div>
                </ModernSection>
            )}
            {actionError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
            )}

            {!loading && !error && sortedInteractions.length === 0 && (
                <ModernSection title="Keine Szenarien" description="Es sind noch keine Szenarien vorhanden.">
                    <div className="text-sm text-gray-500">Erstelle oder synchronisiere Szenarien, um sie hier zu sehen.</div>
                </ModernSection>
            )}

            {!loading && !error && sortedInteractions.length > 0 && (
                <ModernSection title="Szenarienliste" description="Direkt ausführen oder öffnen.">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {sortedInteractions.map((interaction) => {
                            const actionCount = interaction.rules?.reduce((count, rule) => count + (rule.actions?.length ?? 0), 0) ?? 0;
                            return (
                                <div key={interaction.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-start gap-2">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900">{interaction.name ?? interaction.id}</h3>
                                            <div className="mt-1 text-sm text-slate-500">{actionCount} Aktionen</div>
                                            <div className="mt-1 text-xs text-slate-400">Aktualisiert: {formatTime(interaction.modified)}</div>
                                        </div>
                                        <span className="ml-auto inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                                            #{interaction.id.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <PrimaryButton
                                            filled
                                            status="success"
                                            disabled={activeInteractionId === interaction.id}
                                            onClick={() => {
                                                void triggerInteraction(interaction.id);
                                            }}
                                        >
                                            {activeInteractionId === interaction.id ? "Wird ausgeführt..." : "Ausführen"}
                                        </PrimaryButton>
                                        <PrimaryButton
                                            status="warning"
                                            onClick={() => {
                                                navigate(`/scenarios/${interaction.id}`);
                                            }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <Settings2 size={14}/> Bearbeiten
                                            </span>
                                        </PrimaryButton>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ModernSection>
            )}
        </div>
    </PageComponent>
}
