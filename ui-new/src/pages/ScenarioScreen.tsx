import {Suspense, useCallback, useMemo, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Interaction} from "@/src/models/Interaction.ts";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useNavigate} from "react-router-dom";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bolt, Layers, PlayCircle, Search, Sparkles, Workflow} from "lucide-react";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {
    buildAutomationPresentationLookup,
    readAutomationCategory,
    readAutomationState,
    summarizeInteraction
} from "@/src/utils/automationPresentation.ts";
import {useTranslation} from "react-i18next";

const ALL_CATEGORIES = "__all_categories__";

const ScenarioScreenContent = () => {
    const {t} = useTranslation();
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);
    const [activeInteractionId, setActiveInteractionId] = useState<string | undefined>(undefined);
    const [actionError, setActionError] = useState<string | undefined>(undefined);
    const [refreshPending, setRefreshPending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
    const navigate = useNavigate();

    const {data: interactionsResponse} = apiQueryClient.useSuspenseQuery("get", "/interaction");
    const interactions = (interactionsResponse as Interaction[] | undefined) ?? [];

    const sortedInteractions = useMemo(() => {
        return [...interactions].sort((a, b) => (a.name ?? a.id).localeCompare((b.name ?? b.id)));
    }, [interactions]);

    const presentationLookup = useMemo(() => {
        return buildAutomationPresentationLookup(allThings);
    }, [allThings]);

    const categories = useMemo(() => {
        const unique = new Set<string>();
        for (const interaction of sortedInteractions) {
            unique.add(readAutomationCategory(interaction));
        }
        return [ALL_CATEGORIES, ...Array.from(unique).sort((left, right) => left.localeCompare(right))];
    }, [sortedInteractions]);

    const filteredInteractions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return sortedInteractions.filter((interaction) => {
            const category = readAutomationCategory(interaction);
            const matchesCategory = selectedCategory === ALL_CATEGORIES || category === selectedCategory;
            if (!matchesCategory) {
                return false;
            }
            if (normalizedSearch.length === 0) {
                return true;
            }
            const name = (interaction.name ?? "").toLowerCase();
            const id = interaction.id.toLowerCase();
            const description = (interaction.tags?.description ?? "").toLowerCase();
            return name.includes(normalizedSearch) || id.includes(normalizedSearch) || description.includes(normalizedSearch);
        });
    }, [searchTerm, selectedCategory, sortedInteractions]);

    const aggregatedStats = useMemo(() => {
        return filteredInteractions.reduce((stats, interaction) => {
            const interactionSummary = summarizeInteraction(interaction, presentationLookup);
            stats.rules += interactionSummary.totalRuleCount;
            stats.triggers += interactionSummary.totalTriggerCount;
            stats.actions += interactionSummary.totalActionCount;
            return stats;
        }, {rules: 0, triggers: 0, actions: 0});
    }, [filteredInteractions, presentationLookup]);

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
            setActionError(t("ui_new.automation.trigger_failed"));
        } finally {
            setActiveInteractionId(undefined);
        }
    }, [t]);

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
            setActionError(t("ui_new.automation.refresh_failed"));
        } finally {
            setRefreshPending(false);
        }
    }, [setAllThings, t]);

    return <PageComponent title={t("ui_new.automation.page_title")}>
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={t("ui_new.automation.hero_title")}
                subtitle={t("ui_new.automation.hero_subtitle")}
                badges={[
                    {label: t("ui_new.automation.count_automations", {count: filteredInteractions.length}), icon: <Workflow size={14}/>},
                    {label: t("ui_new.automation.count_rules", {count: aggregatedStats.rules}), icon: <Layers size={14}/>},
                    {label: t("ui_new.automation.count_actions", {count: aggregatedStats.actions}), icon: <Bolt size={14}/>}
                ]}
                actionSlot={
                    <div className="min-w-[180px]">
                        <PrimaryButton
                            filled
                            disabled={refreshPending}
                            onClick={() => {
                                void refreshFromBackend();
                            }}
                            className="bg-white/15 border-white/40 text-white hover:bg-white/25"
                        >
                            {refreshPending ? t("ui_new.automation.syncing") : t("ui_new.automation.sync")}
                        </PrimaryButton>
                    </div>
                }
                stats={[
                    {label: t("ui_new.automation.stats_filtered"), value: filteredInteractions.length},
                    {label: t("ui_new.automation.stats_triggers"), value: aggregatedStats.triggers},
                    {label: t("ui_new.automation.stats_actions"), value: aggregatedStats.actions},
                    {label: t("ui_new.automation.stats_categories"), value: categories.length - 1}
                ]}
            />

            {actionError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{actionError}</div>
            )}

            <ModernSection title={t("ui_new.automation.filter_title")} description={t("ui_new.automation.filter_description")} icon={<Search size={18}/>}>
                <div className="grid gap-3">
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="mb-1 block font-medium">{t("ui_new.automation.search_label")}</span>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder={t("ui_new.automation.search_placeholder")}
                            className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-900/50"
                        />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setSelectedCategory(category)}
                                className={selectedCategory === category
                                    ? "rounded-full border border-cyan-500 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-200"
                                    : "rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                }
                            >
                                {category === ALL_CATEGORIES ? t("ui_new.automation.all_categories") : category}
                            </button>
                        ))}
                    </div>
                </div>
            </ModernSection>

            {filteredInteractions.length === 0 && (
                <ModernSection title={t("ui_new.automation.none_title")} description={t("ui_new.automation.none_description")}>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t("ui_new.automation.none_hint")}</div>
                </ModernSection>
            )}

            {filteredInteractions.length > 0 && (
                <ModernSection title={t("ui_new.automation.section_title")} description={t("ui_new.automation.section_description")} icon={<Sparkles size={18}/>}>
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {filteredInteractions.map((interaction) => {
                            const summary = summarizeInteraction(interaction, presentationLookup);
                            const category = readAutomationCategory(interaction);
                            const state = readAutomationState(interaction, allThings);

                            return (
                                <div key={interaction.id} className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
                                    <div className="flex items-start gap-2">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{interaction.name ?? interaction.id}</h3>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{t("ui_new.automation.category_label")}: {category}</div>
                                            <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t("ui_new.automation.updated_label", {time: formatTime(interaction.modified)})}</div>
                                        </div>
                                        <span className={state === "Aktiv"
                                            ? "ml-auto inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                            : state === "Inaktiv"
                                                ? "ml-auto inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                                : "ml-auto inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }>
                                            {state}
                                        </span>
                                    </div>

                                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{t("ui_new.automation.count_rules", {count: summary.totalRuleCount})}</div>
                                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{t("ui_new.automation.count_triggers", {count: summary.totalTriggerCount})}</div>
                                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{t("ui_new.automation.count_actions", {count: summary.totalActionCount})}</div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {summary.rulePreviews.slice(0, 2).map((rulePreview, index) => (
                                            <div key={`${interaction.id}-rule-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/80">
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{t("ui_new.automation.when")}</div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {(rulePreview.whenChips.length > 0 ? rulePreview.whenChips : [t("ui_new.automation.no_trigger")]).slice(0, 4).map((chip) => (
                                                        <span key={chip} className="rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1 text-[11px] text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-200">{chip}</span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-200">{t("ui_new.automation.then")}</div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {(rulePreview.thenChips.length > 0 ? rulePreview.thenChips : [t("ui_new.automation.no_action")]).slice(0, 4).map((chip) => (
                                                        <span key={chip} className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-1 text-[11px] text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100">{chip}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
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
                                            <span className="inline-flex items-center gap-2"><PlayCircle size={14}/>{activeInteractionId === interaction.id ? t("ui_new.automation.executing") : t("ui_new.automation.execute_now")}</span>
                                        </PrimaryButton>
                                        <PrimaryButton
                                            status="warning"
                                            onClick={() => {
                                                navigate(`/automation/${interaction.id}`);
                                            }}
                                        >
                                            {t("ui_new.automation.details")}
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
