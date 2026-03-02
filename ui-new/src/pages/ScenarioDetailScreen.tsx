import {Suspense, useCallback, useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {Interaction} from "@/src/models/Interaction.ts";
import {useContentModel} from "@/src/store.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bolt, Calendar, Save, Workflow} from "lucide-react";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {HeatingAutomationEditor} from "@/src/components/automation/HeatingAutomationEditor.tsx";
import {AutomationRuleEditor} from "@/src/components/automation/AutomationRuleEditor.tsx";
import {
    buildAutomationPresentationLookup,
    readAutomationCategory,
    readAutomationState,
    readAutomationWritableStateBinding,
    summarizeInteraction
} from "@/src/utils/automationPresentation.ts";
import {
    AutomationRuleDraft,
    buildCapabilityCatalog,
    buildInteractionRulesFromDrafts,
    createRuleDraftsFromInteraction,
    validateAutomationRuleDrafts
} from "@/src/utils/automationRuleEditor.ts";
import {
    applyHeatingSchedulesToInteraction,
    HeatingDaySchedule,
    isHeatingAutomation,
    parseHeatingDaySchedules,
    validateHeatingSchedules
} from "@/src/utils/heatingAutomation.ts";
import {useTranslation} from "react-i18next";

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

const buildDisabledInteractionTimestampIso = (): string => {
    const disabledDate = new Date();
    disabledDate.setUTCFullYear(2000);
    return disabledDate.toISOString();
};

const isLegacyDisabledWindow = (validFromInput: string, validToInput: string): boolean => {
    if (!validFromInput || !validToInput) {
        return false;
    }

    const validFromDate = new Date(validFromInput);
    const validToDate = new Date(validToInput);
    if (Number.isNaN(validFromDate.getTime()) || Number.isNaN(validToDate.getTime())) {
        return false;
    }

    return validFromDate.getFullYear() === 2000 && validToDate.getFullYear() === 2000;
};

const ScenarioDetailContent = ({interactionId}: {interactionId: string}) => {
    const {t} = useTranslation();
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const {data: interactionResponse} = apiQueryClient.useSuspenseQuery("get", "/interaction/{id}", {
        params: {
            path: {id: interactionId}
        }
    });

    const interaction = interactionResponse as Interaction;
    const presentationLookup = useMemo(() => buildAutomationPresentationLookup(allThings), [allThings]);
    const summary = useMemo(() => summarizeInteraction(interaction, presentationLookup), [interaction, presentationLookup]);
    const category = useMemo(() => readAutomationCategory(interaction), [interaction]);
    const automationState = useMemo(() => readAutomationState(interaction, allThings), [allThings, interaction]);
    const writableStateBinding = useMemo(() => readAutomationWritableStateBinding(interaction), [interaction]);
    const canPersistAutomationEnabled = writableStateBinding !== undefined || !interaction?.isInternal;
    const heatingAutomation = useMemo(() => isHeatingAutomation(interaction), [interaction]);
    const capabilityCatalog = useMemo(() => buildCapabilityCatalog(allThings), [allThings]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [homeVisible, setHomeVisible] = useState(false);
    const [automationEnabled, setAutomationEnabled] = useState(true);
    const [validFrom, setValidFrom] = useState("");
    const [validTo, setValidTo] = useState("");
    const [heatingSchedules, setHeatingSchedules] = useState<HeatingDaySchedule[]>([]);
    const [ruleDrafts, setRuleDrafts] = useState<AutomationRuleDraft[]>([]);
    const [savePending, setSavePending] = useState(false);
    const [triggerPending, setTriggerPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [success, setSuccess] = useState<string | undefined>(undefined);
    const heatingValidation = useMemo(() => validateHeatingSchedules(heatingSchedules), [heatingSchedules]);
    const ruleValidation = useMemo(() => validateAutomationRuleDrafts(ruleDrafts), [ruleDrafts]);

    const heatingRoomName = useMemo(() => {
        if (!heatingAutomation) return undefined;
        const firstTarget = heatingSchedules.find((schedule) => schedule.targetCapability)?.targetCapability;
        if (!firstTarget) return undefined;

        const capabilityId = firstTarget.replace("/capability/", "");
        const device = Object.values(allThings?.devices ?? {}).find((entry) => {
            const capabilities = Array.isArray(entry.capabilityData) ? entry.capabilityData : [];
            if (capabilities.some((capability) => capability.id === capabilityId)) {
                return true;
            }
            return (entry.capabilities ?? []).some((capabilityRef) => capabilityRef.replace("/capability/", "") === capabilityId);
        });

        return device?.locationData?.config?.name ?? device?.config?.name;
    }, [allThings?.devices, heatingAutomation, heatingSchedules]);

    useEffect(() => {
        setName(interaction?.name ?? "");
        setDescription(interaction?.tags?.description ?? "");
        setHomeVisible(interaction?.tags?.homeScreenVisible === "true");
        setAutomationEnabled(automationState === "Aktiv");
        setValidFrom(toDateTimeInput(interaction?.validFrom));
        setValidTo(toDateTimeInput(interaction?.validTo));
        setHeatingSchedules(parseHeatingDaySchedules(interaction));
        setRuleDrafts(createRuleDraftsFromInteraction(interaction));
    }, [automationState, interaction]);

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

        if (heatingAutomation) {
            if (heatingSchedules.length === 0) {
                setError(t("ui_new.automation.heating_no_rules"));
                setSuccess(undefined);
                return;
            }
            if (heatingSchedules.some((schedule) => !schedule.targetCapability)) {
                setError(t("ui_new.automation.heating_no_target"));
                setSuccess(undefined);
                return;
            }
            const validationMessage = validateHeatingSchedules(heatingSchedules);
            if (validationMessage) {
                setError(t("ui_new.automation.heating_invalid", {message: validationMessage}));
                setSuccess(undefined);
                return;
            }
        }
        if (!heatingAutomation) {
            const validationMessage = validateAutomationRuleDrafts(ruleDrafts);
            if (validationMessage) {
                setError(t("ui_new.automation.rules_invalid", {message: validationMessage}));
                setSuccess(undefined);
                return;
            }
        }

        const nextTags: Record<string, string> = {
            ...(interaction.tags ?? {}),
            description: description.trim(),
            homeScreenVisible: homeVisible ? "true" : "false"
        };
        if (writableStateBinding?.container === "tags") {
            nextTags[writableStateBinding.key] = automationEnabled ? "true" : "false";
        }

        let nextInteractionBase: Interaction = {
            ...interaction,
            name: name.trim(),
            tags: nextTags,
            validFrom: toISOStringOrUndefined(validFrom),
            validTo: toISOStringOrUndefined(validTo)
        };

        if (writableStateBinding?.container === "interaction") {
            nextInteractionBase = {
                ...(nextInteractionBase as unknown as Record<string, unknown>),
                [writableStateBinding.key]: automationEnabled
            } as Interaction;
        }

        if (!heatingAutomation) {
            nextInteractionBase = {
                ...nextInteractionBase,
                rules: buildInteractionRulesFromDrafts(ruleDrafts, capabilityCatalog)
            };
        }

        const nextInteraction = heatingAutomation
            ? applyHeatingSchedulesToInteraction(nextInteractionBase, heatingSchedules)
            : nextInteractionBase;

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
            setSuccess(t("ui_new.automation.save_success"));
        } catch (saveError) {
            console.error("Could not save interaction", saveError);
            setError(t("ui_new.automation.save_failed"));
        } finally {
            setSavePending(false);
        }
    }, [automationEnabled, capabilityCatalog, description, heatingAutomation, heatingSchedules, homeVisible, interaction, interactionId, name, persistInteractionIntoStore, ruleDrafts, savePending, t, validFrom, validTo, writableStateBinding]);

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
            setSuccess(t("ui_new.automation.trigger_success"));
        } catch (triggerError) {
            console.error("Could not trigger interaction", triggerError);
            setError(t("ui_new.automation.trigger_failed"));
        } finally {
            setTriggerPending(false);
        }
    }, [interactionId, t, triggerPending]);

    return (
        <PageComponent title={t("ui_new.automation.edit_title")} to="/automation">
            <div className="space-y-5 p-4 md:p-6">
                <ModernHero
                    title={interaction?.name ?? t("ui_new.automation.page_title")}
                    subtitle={heatingAutomation
                        ? t("ui_new.automation.heating_editor_subtitle")
                        : t("ui_new.automation.edit_subtitle")
                    }
                    badges={[
                        {label: t("ui_new.automation.count_rules", {count: summary.totalRuleCount}), icon: <Workflow size={14}/>},
                        {label: t("ui_new.automation.count_triggers", {count: summary.totalTriggerCount}), icon: <Calendar size={14}/>},
                        {label: t("ui_new.automation.count_actions", {count: summary.totalActionCount}), icon: <Bolt size={14}/>}
                    ]}
                    stats={[
                        {label: t("ui_new.automation.category_label"), value: category},
                        {label: t("ui_new.common.status"), value: automationState},
                        {label: t("ui_new.automation.type"), value: heatingAutomation ? t("ui_new.automation.heating_program") : t("ui_new.automation.standard")},
                        {label: t("ui_new.automation.save"), value: savePending ? t("ui_new.common.active") : t("ui_new.automation.ready")},
                        {label: t("ui_new.automation.execute"), value: triggerPending ? t("ui_new.common.active") : t("ui_new.automation.ready")}
                    ]}
                />

                {error && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                {success && <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
                {heatingAutomation && heatingValidation && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {t("ui_new.automation.heating_validation_label")}: {heatingValidation}
                    </div>
                )}
                {!heatingAutomation && ruleValidation && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {t("ui_new.automation.rule_validation_label")}: {ruleValidation}
                    </div>
                )}

                {heatingAutomation && (
                    <ModernSection
                        title={t("ui_new.automation.heating_plan_title")}
                        description={t("ui_new.automation.heating_plan_description")}
                        icon={<Workflow size={18}/>}
                    >
                        <HeatingAutomationEditor
                            schedules={heatingSchedules}
                            roomName={heatingRoomName}
                            onChange={setHeatingSchedules}
                        />
                    </ModernSection>
                )}

                {!heatingAutomation && (
                    <ModernSection
                        title={t("ui_new.automation.edit_rules_title")}
                        description={t("ui_new.automation.edit_rules_description")}
                        icon={<Workflow size={18}/>}
                    >
                        <AutomationRuleEditor drafts={ruleDrafts} catalog={capabilityCatalog} onChange={setRuleDrafts}/>
                    </ModernSection>
                )}

                <ModernSection
                    title={t("ui_new.automation.configuration_title")}
                    description={heatingAutomation
                        ? t("ui_new.automation.configuration_description_heating")
                        : t("ui_new.automation.configuration_description_default")
                    }
                    icon={<Calendar size={18}/>}
                >
                    <div className="grid gap-3">
                        <label className="text-sm text-slate-700">
                            <span className="mb-1 block font-medium">{t("ui_new.common.name")}</span>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                            />
                        </label>
                        <label className="text-sm text-slate-700">
                            <span className="mb-1 block font-medium">{t("ui_new.common.description")}</span>
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
                            {t("ui_new.automation.show_on_home")}
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={automationEnabled}
                                onChange={(event) => {
                                    const nextEnabled = event.target.checked;
                                    setAutomationEnabled(nextEnabled);

                                    // Interactions without explicit enabled flag are toggled through validFrom/validTo.
                                    if (!writableStateBinding && !interaction?.isInternal) {
                                        if (nextEnabled) {
                                            if (heatingAutomation || isLegacyDisabledWindow(validFrom, validTo)) {
                                                setValidFrom("");
                                                setValidTo("");
                                            }
                                        } else {
                                            const disabledInput = toDateTimeInput(buildDisabledInteractionTimestampIso());
                                            setValidFrom(disabledInput);
                                            setValidTo(disabledInput);
                                        }
                                    }
                                }}
                                disabled={!canPersistAutomationEnabled}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            {t("ui_new.automation.enabled")}
                        </label>
                        {!canPersistAutomationEnabled && (
                            <div className="text-xs text-slate-500">
                                {t("ui_new.automation.enabled_readonly_hint")}
                            </div>
                        )}
                        {!heatingAutomation && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <label className="text-sm text-slate-700">
                                    <span className="mb-1 block font-medium">{t("ui_new.automation.valid_from")}</span>
                                    <input
                                        type="datetime-local"
                                        value={validFrom}
                                        onChange={(event) => setValidFrom(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                    />
                                </label>
                                <label className="text-sm text-slate-700">
                                    <span className="mb-1 block font-medium">{t("ui_new.automation.valid_to")}</span>
                                    <input
                                        type="datetime-local"
                                        value={validTo}
                                        onChange={(event) => setValidTo(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <PrimaryButton
                            filled
                            disabled={savePending}
                            onClick={() => {
                                void onSave();
                            }}
                        >
                            <span className="inline-flex items-center gap-2"><Save size={14}/>{savePending ? t("ui_new.automation.saving") : t("ui_new.automation.save")}</span>
                        </PrimaryButton>
                        <PrimaryButton
                            filled
                            status="warning"
                            disabled={triggerPending}
                            onClick={() => {
                                void onTrigger();
                            }}
                        >
                            <span className="inline-flex items-center gap-2"><Bolt size={14}/>{triggerPending ? t("ui_new.automation.running") : t("ui_new.automation.execute")}</span>
                        </PrimaryButton>
                    </div>
                </ModernSection>
            </div>
        </PageComponent>
    );
};

export const ScenarioDetailScreen = () => {
    const {t} = useTranslation();
    const params = useParams<{ id: string }>();
    const interactionId = params.id;

    if (!interactionId) {
        return (
            <PageComponent title={t("ui_new.automation.edit_title")} to="/automation">
                <div className="p-4 md:p-6">
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{t("ui_new.automation.id_missing")}</div>
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
