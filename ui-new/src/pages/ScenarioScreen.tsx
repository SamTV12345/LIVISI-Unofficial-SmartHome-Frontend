import {Suspense, useCallback, useMemo, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Interaction} from "@/src/models/Interaction.ts";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useNavigate} from "react-router-dom";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bolt, Layers, Settings2} from "lucide-react";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";

const ScenarioScreenContent = () => {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const [activeInteractionId, setActiveInteractionId] = useState<string | undefined>(undefined);
    const [actionError, setActionError] = useState<string | undefined>(undefined);
    const [refreshPending, setRefreshPending] = useState(false);
    const navigate = useNavigate();

    const {data: interactionsResponse} = apiQueryClient.useSuspenseQuery("get", "/interaction");
    const interactions = (interactionsResponse as Interaction[] | undefined) ?? [];

    const sortedInteractions = useMemo(() => {
        return [...interactions].sort((a, b) => (a.name ?? a.id).localeCompare((b.name ?? b.id)));
    }, [interactions]);

    const totalActionCount = useMemo(() => {
        return sortedInteractions.reduce((count, interaction) => count + (interaction.rules?.reduce((ruleCount, rule) => ruleCount + (rule.actions?.length ?? 0), 0) ?? 0), 0);
    }, [sortedInteractions]);

    const triggerInteraction = useCallback(async (interactionId: string) => {
        setActionError(undefined);
        setActiveInteractionId(interactionId);
        try {
            const response = await openapiFetchClient.POST("/interaction/{id}/trigger", {
                params: {
                    path: {id: interactionId}
                }
            });
            if (!response.response.ok) {
                throw new Error("Interaction trigger failed");
            }
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
            await queryClient.invalidateQueries({
                queryKey: apiQueryClient.queryOptions("get", "/interaction").queryKey
            });
            const refreshedData = queryClient.getQueryData(apiQueryClient.queryOptions("get", "/interaction").queryKey) as Interaction[] | undefined;
            const latestAllThings = useContentModel.getState().allThings;
            if (latestAllThings && refreshedData) {
                setAllThings({
                    ...latestAllThings,
                    interactions: refreshedData
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
                    {label: "Status", value: "Bereit"},
                    {label: "Fehler", value: actionError ? "Ja" : "Nein"}
                ]}
            />

            {actionError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
            )}

            {sortedInteractions.length === 0 && (
                <ModernSection title="Keine Szenarien" description="Es sind noch keine Szenarien vorhanden.">
                    <div className="text-sm text-gray-500">Erstelle oder synchronisiere Szenarien, um sie hier zu sehen.</div>
                </ModernSection>
            )}

            {sortedInteractions.length > 0 && (
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
    </PageComponent>;
};

export const ScenarioScreen = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={4}/>}>
            <ScenarioScreenContent/>
        </Suspense>
    );
};
