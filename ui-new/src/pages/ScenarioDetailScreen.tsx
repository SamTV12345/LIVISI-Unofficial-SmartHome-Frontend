import {Suspense, useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {Interaction} from "@/src/models/Interaction.ts";
import {useContentModel} from "@/src/store.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bolt, Calendar, Save, Settings2} from "lucide-react";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";

const toDateTimeInput = (isoDateTime?: string): string => {
    if (!isoDateTime) return "";
    const date = new Date(isoDateTime);
    if (Number.isNaN(date.getTime())) return "";
    const offsetMs = date.getTimezoneOffset() * 60_000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
};

const toISOStringOrUndefined = (localDateTime: string): string | undefined => {
    if (!localDateTime) return undefined;
    const parsed = new Date(localDateTime);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
};

const ScenarioDetailContent = ({interactionId}: {interactionId: string}) => {
    const navigate = useNavigate();
    const setAllThings = useContentModel((state) => state.setAllThings);
    const {data: interactionResponse} = apiQueryClient.useSuspenseQuery("get", "/interaction/{id}", {
        params: {
            path: {id: interactionId}
        }
    });

    const interaction = interactionResponse as Interaction;
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [homeVisible, setHomeVisible] = useState(false);
    const [validFrom, setValidFrom] = useState("");
    const [validTo, setValidTo] = useState("");
    const [savePending, setSavePending] = useState(false);
    const [triggerPending, setTriggerPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [success, setSuccess] = useState<string | undefined>(undefined);

    useEffect(() => {
        setName(interaction?.name ?? "");
        setDescription(interaction?.tags?.description ?? "");
        setHomeVisible(interaction?.tags?.homeScreenVisible === "true");
        setValidFrom(toDateTimeInput(interaction?.validFrom));
        setValidTo(toDateTimeInput(interaction?.validTo));
    }, [interaction?.id, interaction?.name, interaction?.tags?.description, interaction?.tags?.homeScreenVisible, interaction?.validFrom, interaction?.validTo]);

    const actionCount = useMemo(() => {
        return interaction?.rules?.reduce((count, rule) => count + (rule.actions?.length ?? 0), 0) ?? 0;
    }, [interaction?.rules]);

    const persistInteractionIntoStore = useCallback((nextInteraction: Interaction) => {
        const currentState = useContentModel.getState().allThings;
        if (!currentState) return;
        const currentInteractions = currentState.interactions ?? [];
        const nextInteractions = currentInteractions.some((entry) => entry.id === nextInteraction.id)
            ? currentInteractions.map((entry) => entry.id === nextInteraction.id ? nextInteraction : entry)
            : [...currentInteractions, nextInteraction];
        setAllThings({
            ...currentState,
            interactions: nextInteractions
        });
    }, [setAllThings]);

    const onSave = useCallback(async () => {
        if (!interaction || savePending) return;

        const nextInteraction: Interaction = {
            ...interaction,
            name: name.trim(),
            tags: {
                ...(interaction.tags ?? {}),
                description: description.trim(),
                homeScreenVisible: homeVisible ? "true" : "false"
            },
            validFrom: toISOStringOrUndefined(validFrom),
            validTo: toISOStringOrUndefined(validTo)
        };

        setSavePending(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            const response = await openapiFetchClient.PUT("/interaction/{id}", {
                params: {
                    path: {id: interactionId}
                },
                body: nextInteraction
            });
            if (!response.response.ok) {
                throw new Error("Interaction save failed");
            }
            const persistedInteraction = (response.data as Interaction | undefined) ?? nextInteraction;
            persistInteractionIntoStore(persistedInteraction);
            queryClient.setQueryData(
                apiQueryClient.queryOptions("get", "/interaction/{id}", {params: {path: {id: interactionId}}}).queryKey,
                persistedInteraction
            );
            setSuccess("Szenario gespeichert.");
        } catch (saveError) {
            console.error("Could not save interaction", saveError);
            setError("Szenario konnte nicht gespeichert werden.");
        } finally {
            setSavePending(false);
        }
    }, [description, homeVisible, interaction, interactionId, name, persistInteractionIntoStore, savePending, validFrom, validTo]);

    const onTrigger = useCallback(async () => {
        if (triggerPending) return;
        setTriggerPending(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            const response = await openapiFetchClient.POST("/interaction/{id}/trigger", {
                params: {
                    path: {id: interactionId}
                }
            });
            if (!response.response.ok) {
                throw new Error("Interaction trigger failed");
            }
            setSuccess("Szenario wurde ausgelöst.");
        } catch (triggerError) {
            console.error("Could not trigger interaction", triggerError);
            setError("Szenario konnte nicht ausgelöst werden.");
        } finally {
            setTriggerPending(false);
        }
    }, [interactionId, triggerPending]);

    return (
        <PageComponent title="Szenario bearbeiten" to="/scenarios">
            <div className="space-y-5 p-4 md:p-6">
                <ModernHero
                    title={interaction?.name ?? "Szenario"}
                    subtitle="Szenario-Metadaten und Zeitfenster konfigurieren."
                    badges={[
                        {label: `${actionCount} Aktionen`, icon: <Bolt size={14}/>},
                        {label: homeVisible ? "Auf Home sichtbar" : "Nicht auf Home", icon: <Settings2 size={14}/>}
                    ]}
                    stats={[
                        {label: "Status", value: "Bereit"},
                        {label: "Speichern", value: savePending ? "Aktiv" : "Bereit"},
                        {label: "Ausführen", value: triggerPending ? "Aktiv" : "Bereit"},
                        {label: "Fehler", value: error ? "Ja" : "Nein"}
                    ]}
                />

                {error && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                {success && <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

                <ModernSection title="Konfiguration" description="Name, Beschreibung und Zeitfenster bearbeiten." icon={<Calendar size={18}/>}>
                    <div className="grid gap-3">
                        <label className="text-sm text-slate-700">
                            <span className="mb-1 block font-medium">Name</span>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                            />
                        </label>
                        <label className="text-sm text-slate-700">
                            <span className="mb-1 block font-medium">Beschreibung</span>
                            <input
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                            />
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={homeVisible}
                                onChange={(event) => setHomeVisible(event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Auf Home anzeigen
                        </label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">Gültig ab</span>
                                <input
                                    type="datetime-local"
                                    value={validFrom}
                                    onChange={(event) => setValidFrom(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                />
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">Gültig bis</span>
                                <input
                                    type="datetime-local"
                                    value={validTo}
                                    onChange={(event) => setValidTo(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                />
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <PrimaryButton
                            filled
                            disabled={savePending}
                            onClick={() => {
                                void onSave();
                            }}
                        >
                            <span className="inline-flex items-center gap-2"><Save size={14}/>{savePending ? "Speichert..." : "Speichern"}</span>
                        </PrimaryButton>
                        <PrimaryButton
                            filled
                            status="warning"
                            disabled={triggerPending}
                            onClick={() => {
                                void onTrigger();
                            }}
                        >
                            <span className="inline-flex items-center gap-2"><Bolt size={14}/>{triggerPending ? "Läuft..." : "Ausführen"}</span>
                        </PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/scenarios")}>Zurück</PrimaryButton>
                    </div>
                </ModernSection>
            </div>
        </PageComponent>
    );
};

export const ScenarioDetailScreen = () => {
    const params = useParams<{ id: string }>();
    const interactionId = params.id;

    if (!interactionId) {
        return (
            <PageComponent title="Szenario bearbeiten" to="/scenarios">
                <div className="p-4 md:p-6">
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">Szenario-ID fehlt.</div>
                </div>
            </PageComponent>
        );
    }

    return (
        <Suspense fallback={<PageSkeleton cards={3}/>}>
            <ScenarioDetailContent interactionId={interactionId}/>
        </Suspense>
    );
};
