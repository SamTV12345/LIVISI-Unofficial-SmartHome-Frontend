import {Plus, Trash2, TriangleAlert} from "lucide-react";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {
    AutomationRuleDraft,
    CapabilityCatalog,
    createDefaultRuleDraft,
    DAY_MASK_OPTIONS,
    getDayMaskLabel,
    switchActionKind,
    switchTriggerKind
} from "@/src/utils/automationRuleEditor.ts";

type AutomationRuleEditorProps = {
    drafts: AutomationRuleDraft[],
    catalog: CapabilityCatalog,
    onChange: (nextDrafts: AutomationRuleDraft[]) => void
};

const selectClassName = "w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100";
const inputClassName = "w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100";

const targetOptionsForAction = (kind: AutomationRuleDraft["action"]["kind"], catalog: CapabilityCatalog) => {
    if (kind === "onState" || kind === "switchTimer") return catalog.switchTargets;
    if (kind === "setpoint") return catalog.setpointTargets;
    if (kind === "notify") return catalog.notifyTargets;
    return catalog.options;
};

const sourceOptionsForTrigger = (kind: AutomationRuleDraft["trigger"]["kind"], catalog: CapabilityCatalog) => {
    if (kind === "button") return catalog.buttonSources;
    if (kind === "weekly") return catalog.calendarSources;
    return catalog.options;
};

const updateRule = (drafts: AutomationRuleDraft[], index: number, nextRule: AutomationRuleDraft): AutomationRuleDraft[] => {
    return drafts.map((entry, currentIndex) => currentIndex === index ? nextRule : entry);
};

export const AutomationRuleEditor = ({drafts, catalog, onChange}: AutomationRuleEditorProps) => {
    const addRule = () => {
        onChange([...drafts, createDefaultRuleDraft(catalog)]);
    };

    if (drafts.length === 0) {
        return (
            <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    Noch keine Regeln vorhanden.
                </div>
                <PrimaryButton onClick={addRule}>
                    <span className="inline-flex items-center gap-2"><Plus size={14}/>Neue Regel hinzufuegen</span>
                </PrimaryButton>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {drafts.map((draft, ruleIndex) => {
                const sourceOptions = sourceOptionsForTrigger(draft.trigger.kind, catalog);
                const targetOptions = targetOptionsForAction(draft.action.kind, catalog);
                const triggerSourceValue = draft.trigger.kind === "button" || draft.trigger.kind === "weekly" ? draft.trigger.source : "";
                const actionTargetValue = draft.action.kind !== "unknown" ? draft.action.target : "";

                return (
                    <div key={`rule-editor-${ruleIndex}`} className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">Regel {ruleIndex + 1}</div>
                            <button
                                type="button"
                                className="ml-auto rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                                onClick={() => onChange(drafts.filter((_, index) => index !== ruleIndex))}
                                aria-label="Regel entfernen"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>

                        {!draft.editable && (
                            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                                <div className="inline-flex items-center gap-2"><TriangleAlert size={14}/>Diese Regel hat ein komplexes Format und kann hier nicht direkt bearbeitet werden. Sie bleibt beim Speichern unveraendert.</div>
                            </div>
                        )}

                        {draft.editable && (
                            <div className="mt-3 space-y-4">
                                <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Wenn</div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <label className="text-xs font-medium text-slate-700">
                                            Ausloeser
                                            <select
                                                className={selectClassName}
                                                value={draft.trigger.kind}
                                                onChange={(event) => {
                                                    const nextKind = event.target.value as "button" | "weekly";
                                                    onChange(updateRule(drafts, ruleIndex, switchTriggerKind(draft, nextKind, catalog)));
                                                }}
                                            >
                                                <option value="button">Tastendruck</option>
                                                <option value="weekly">Zeitpunkt</option>
                                            </select>
                                        </label>

                                        <label className="text-xs font-medium text-slate-700">
                                            Quelle
                                            <select
                                                className={selectClassName}
                                                value={triggerSourceValue}
                                                onChange={(event) => {
                                                    if (draft.trigger.kind === "button") {
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            trigger: {
                                                                kind: "button",
                                                                source: event.target.value,
                                                                buttonIndex: draft.trigger.buttonIndex,
                                                                namespace: draft.trigger.namespace
                                                            }
                                                        }));
                                                        return;
                                                    }

                                                    if (draft.trigger.kind === "weekly") {
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            trigger: {
                                                                kind: "weekly",
                                                                source: event.target.value
                                                                ,
                                                                startTime: draft.trigger.startTime,
                                                                dayOfWeek: draft.trigger.dayOfWeek,
                                                                recurrenceInterval: draft.trigger.recurrenceInterval,
                                                                namespace: draft.trigger.namespace
                                                            }
                                                        }));
                                                    }
                                                }}
                                            >
                                                {sourceOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    {draft.trigger.kind === "button" && (
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <label className="text-xs font-medium text-slate-700">
                                                Taste
                                                <select
                                                    className={selectClassName}
                                                    value={draft.trigger.buttonIndex}
                                                    onChange={(event) => {
                                                        if (draft.trigger.kind !== "button") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            trigger: {
                                                                kind: "button",
                                                                source: draft.trigger.source,
                                                                namespace: draft.trigger.namespace,
                                                                buttonIndex: Number.parseInt(event.target.value, 10)
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    {[1, 2, 3, 4].map((buttonIndex) => (
                                                        <option key={buttonIndex} value={buttonIndex}>Taste {buttonIndex} gedrueckt</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}

                                    {draft.trigger.kind === "weekly" && (
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <label className="text-xs font-medium text-slate-700">
                                                Zeit
                                                <input
                                                    type="time"
                                                    className={inputClassName}
                                                    value={draft.trigger.startTime}
                                                    onChange={(event) => {
                                                        if (draft.trigger.kind !== "weekly") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            trigger: {
                                                                kind: "weekly",
                                                                source: draft.trigger.source,
                                                                dayOfWeek: draft.trigger.dayOfWeek,
                                                                recurrenceInterval: draft.trigger.recurrenceInterval,
                                                                namespace: draft.trigger.namespace,
                                                                startTime: event.target.value
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </label>
                                            <label className="text-xs font-medium text-slate-700">
                                                Tage
                                                <select
                                                    className={selectClassName}
                                                    value={draft.trigger.dayOfWeek}
                                                    onChange={(event) => {
                                                        if (draft.trigger.kind !== "weekly") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            trigger: {
                                                                kind: "weekly",
                                                                source: draft.trigger.source,
                                                                startTime: draft.trigger.startTime,
                                                                recurrenceInterval: draft.trigger.recurrenceInterval,
                                                                namespace: draft.trigger.namespace,
                                                                dayOfWeek: Number.parseInt(event.target.value, 10)
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    {DAY_MASK_OPTIONS.map((day) => (
                                                        <option key={day.value} value={day.value}>{day.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Dann</div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <label className="text-xs font-medium text-slate-700">
                                            Aktion
                                            <select
                                                className={selectClassName}
                                                value={draft.action.kind}
                                                onChange={(event) => {
                                                    const nextKind = event.target.value as "switchTimer" | "onState";
                                                    onChange(updateRule(drafts, ruleIndex, switchActionKind(draft, nextKind, catalog)));
                                                }}
                                            >
                                                <option value="onState">AN/AUS</option>
                                                <option value="switchTimer">Einschalten mit Timer</option>
                                            </select>
                                        </label>

                                        <label className="text-xs font-medium text-slate-700">
                                            Ziel
                                            <select
                                                className={selectClassName}
                                                value={actionTargetValue}
                                                onChange={(event) => {
                                                    if (draft.action.kind === "unknown") return;
                                                    const selected = catalog.byId.get(event.target.value);
                                                    const nextNamespace = selected?.namespace ?? draft.action.namespace;

                                                    if (draft.action.kind === "onState") {
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "onState",
                                                                target: event.target.value,
                                                                namespace: nextNamespace,
                                                                value: draft.action.value
                                                            }
                                                        }));
                                                        return;
                                                    }
                                                    if (draft.action.kind === "switchTimer") {
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "switchTimer",
                                                                target: event.target.value,
                                                                namespace: nextNamespace,
                                                                delaySeconds: draft.action.delaySeconds
                                                            }
                                                        }));
                                                        return;
                                                    }
                                                    if (draft.action.kind === "setpoint") {
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "setpoint",
                                                                target: event.target.value,
                                                                namespace: nextNamespace,
                                                                temperature: draft.action.temperature
                                                            }
                                                        }));
                                                        return;
                                                    }
                                                    onChange(updateRule(drafts, ruleIndex, {
                                                        ...draft,
                                                        action: {
                                                            kind: "notify",
                                                            target: event.target.value,
                                                            namespace: nextNamespace,
                                                            params: draft.action.params
                                                        }
                                                    }));
                                                }}
                                            >
                                                {targetOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    {draft.action.kind === "onState" && (
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <label className="text-xs font-medium text-slate-700">
                                                Zustand
                                                <select
                                                    className={selectClassName}
                                                    value={draft.action.value ? "on" : "off"}
                                                    onChange={(event) => {
                                                        if (draft.action.kind !== "onState") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "onState",
                                                                target: draft.action.target,
                                                                namespace: draft.action.namespace,
                                                                value: event.target.value === "on"
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    <option value="on">Einschalten</option>
                                                    <option value="off">Ausschalten</option>
                                                </select>
                                            </label>
                                        </div>
                                    )}

                                    {draft.action.kind === "switchTimer" && (
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <label className="text-xs font-medium text-slate-700">
                                                Timer (Sekunden)
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className={inputClassName}
                                                    value={draft.action.delaySeconds}
                                                    onChange={(event) => {
                                                        if (draft.action.kind !== "switchTimer") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "switchTimer",
                                                                target: draft.action.target,
                                                                namespace: draft.action.namespace,
                                                                delaySeconds: Math.max(0, Number.parseInt(event.target.value, 10) || 0)
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {draft.action.kind === "setpoint" && (
                                        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs font-medium text-slate-700">Solltemperatur</div>
                                                <div className="text-sm font-semibold text-slate-800">{draft.action.temperature.toFixed(1)} °C</div>
                                            </div>
                                            <div className="mt-3">
                                                <SliderCDN
                                                    min={6}
                                                    max={30}
                                                    step={0.5}
                                                    value={[draft.action.temperature]}
                                                    onValueChange={(values) => {
                                                        if (draft.action.kind !== "setpoint") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "setpoint",
                                                                target: draft.action.target,
                                                                namespace: draft.action.namespace,
                                                                temperature: values[0]
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {draft.action.kind === "notify" && (
                                        <div className="mt-3 grid gap-3">
                                            <label className="text-xs font-medium text-slate-700">
                                                Nachricht (optional)
                                                <input
                                                    className={inputClassName}
                                                    value={typeof draft.action.params.message === "string" ? draft.action.params.message : ""}
                                                    onChange={(event) => {
                                                        if (draft.action.kind !== "notify") return;
                                                        onChange(updateRule(drafts, ruleIndex, {
                                                            ...draft,
                                                            action: {
                                                                kind: "notify",
                                                                target: draft.action.target,
                                                                namespace: draft.action.namespace,
                                                                params: {
                                                                    ...draft.action.params,
                                                                    message: event.target.value
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {draft.editable && (
                            <div className="mt-3 text-xs text-slate-500">
                                {draft.trigger.kind === "weekly"
                                    ? `Ausloeser: ${getDayMaskLabel(draft.trigger.dayOfWeek)} um ${draft.trigger.startTime}`
                                    : "Ausloeser: Tastendruck"}
                            </div>
                        )}
                    </div>
                );
            })}

            <PrimaryButton onClick={addRule}>
                <span className="inline-flex items-center gap-2"><Plus size={14}/>Neue Regel hinzufuegen</span>
            </PrimaryButton>
        </div>
    );
};
