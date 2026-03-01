import {Interaction, InteractionAction, InteractionRule} from "@/src/models/Interaction.ts";
import {AxiosDeviceResponse} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";

type DeviceCapabilityRecord = {
    id: string,
    type?: string,
    capabilityName?: string,
    deviceId?: string
};

export type CapabilityOption = {
    id: string,
    label: string,
    type?: string,
    deviceName?: string,
    capabilityName?: string,
    namespace?: string
};

export type CapabilityCatalog = {
    options: CapabilityOption[],
    byId: Map<string, CapabilityOption>,
    buttonSources: CapabilityOption[],
    calendarSources: CapabilityOption[],
    switchTargets: CapabilityOption[],
    setpointTargets: CapabilityOption[],
    notifyTargets: CapabilityOption[]
};

type RuleTriggerButton = {
    kind: "button",
    source: string,
    buttonIndex: number,
    namespace: string
};

type RuleTriggerWeekly = {
    kind: "weekly",
    source: string,
    startTime: string,
    dayOfWeek: number,
    recurrenceInterval: number,
    namespace: string
};

type RuleTriggerUnknown = {
    kind: "unknown",
    rawTriggers: unknown[]
};

export type RuleTriggerDraft = RuleTriggerButton | RuleTriggerWeekly | RuleTriggerUnknown;

type RuleActionSwitchTimer = {
    kind: "switchTimer",
    target: string,
    namespace: string,
    delaySeconds: number
};

type RuleActionOnState = {
    kind: "onState",
    target: string,
    namespace: string,
    value: boolean
};

type RuleActionSetpoint = {
    kind: "setpoint",
    target: string,
    namespace: string,
    temperature: number
};

type RuleActionNotify = {
    kind: "notify",
    target: string,
    namespace: string,
    params: Record<string, unknown>
};

type RuleActionUnknown = {
    kind: "unknown",
    rawActions: InteractionAction[]
};

export type RuleActionDraft = RuleActionSwitchTimer | RuleActionOnState | RuleActionSetpoint | RuleActionNotify | RuleActionUnknown;

export type AutomationRuleDraft = {
    id?: string,
    conditionEvaluationDelay?: number,
    constraints?: unknown[],
    tags?: Record<string, string>,
    trigger: RuleTriggerDraft,
    action: RuleActionDraft,
    editable: boolean,
    rawRule?: InteractionRule
};

const DEFAULT_DAY_MASK = 127;
const DEFAULT_RECURRENCE = 1;

const dayMaskLabelMap: Record<number, string> = {
    127: "Jeder Tag",
    62: "Mo-Fr",
    65: "Sa-So",
    2: "Montag",
    4: "Dienstag",
    8: "Mittwoch",
    16: "Donnerstag",
    32: "Freitag",
    64: "Samstag",
    1: "Sonntag"
};

export const DAY_MASK_OPTIONS = [
    {value: 127, label: "Jeder Tag"},
    {value: 62, label: "Montag bis Freitag"},
    {value: 65, label: "Samstag und Sonntag"},
    {value: 2, label: "Montag"},
    {value: 4, label: "Dienstag"},
    {value: 8, label: "Mittwoch"},
    {value: 16, label: "Donnerstag"},
    {value: 32, label: "Freitag"},
    {value: 64, label: "Samstag"},
    {value: 1, label: "Sonntag"}
] as const;

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
};

const asNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const asString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeCapabilityId = (value: string): string => value.replace(/^\/+/, "").replace(/^capability\//i, "");
const normalizeDeviceId = (value: string): string => value.replace(/^\/+/, "").replace(/^device\//i, "");
const withCapabilityPrefix = (capabilityId: string): string => capabilityId.startsWith("/capability/") ? capabilityId : `/capability/${capabilityId}`;

const normalizeTime = (timeInput: string): string => {
    const [hourRaw = "00", minuteRaw = "00"] = timeInput.split(":");
    const hour = Math.max(0, Math.min(23, Number.parseInt(hourRaw, 10) || 0));
    const minute = Math.max(0, Math.min(59, Number.parseInt(minuteRaw, 10) || 0));
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
};

const timeToInput = (timeInput?: string): string => {
    if (!timeInput) return "06:00";
    const [hour = "00", minute = "00"] = timeInput.split(":");
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const extractButtonIndex = (trigger: Record<string, unknown>): number => {
    const conditions = trigger.conditions;
    if (!Array.isArray(conditions)) return 1;

    for (const condition of conditions) {
        const conditionRecord = asRecord(condition);
        const params = asRecord(conditionRecord?.params);
        const leftOp = asRecord(params?.leftOp);
        const leftParams = asRecord(leftOp?.params);
        const propertyNameObject = asRecord(leftParams?.eventPropertyName);
        const propertyName = asString(propertyNameObject?.value);
        if (propertyName !== "index") continue;

        const rightOp = asRecord(params?.rightOp);
        const rawValue = asNumber(rightOp?.value);
        if (rawValue === undefined) continue;
        return Math.max(1, Math.min(8, Math.round(rawValue) + 1));
    }

    return 1;
};

const parseTriggerDraft = (rule: InteractionRule): RuleTriggerDraft => {
    const triggers = Array.isArray(rule.triggers) ? rule.triggers : [];
    if (triggers.length === 0) {
        return {kind: "unknown", rawTriggers: []};
    }

    const firstTrigger = asRecord(triggers[0]);
    if (!firstTrigger) {
        return {kind: "unknown", rawTriggers: triggers};
    }

    const subtype = asString(firstTrigger.subtype);
    if (subtype === "WeeklyTrigger") {
        const properties = asRecord(firstTrigger.properties);
        const source = asString(firstTrigger.source);
        if (!source) {
            return {kind: "unknown", rawTriggers: triggers};
        }
        return {
            kind: "weekly",
            source: normalizeCapabilityId(source),
            namespace: asString(firstTrigger.namespace) ?? "core.RWE",
            startTime: timeToInput(asString(properties?.startTime)),
            dayOfWeek: Math.round(asNumber(properties?.dayOfWeek) ?? DEFAULT_DAY_MASK),
            recurrenceInterval: Math.max(1, Math.round(asNumber(properties?.recurrenceInterval) ?? DEFAULT_RECURRENCE))
        };
    }

    const eventType = asString(firstTrigger.eventType);
    if (eventType === "ButtonPressed") {
        const source = asString(firstTrigger.source);
        if (!source) {
            return {kind: "unknown", rawTriggers: triggers};
        }
        return {
            kind: "button",
            source: normalizeCapabilityId(source),
            namespace: asString(firstTrigger.namespace) ?? "core.RWE",
            buttonIndex: extractButtonIndex(firstTrigger)
        };
    }

    return {kind: "unknown", rawTriggers: triggers};
};

const parseActionDraft = (rule: InteractionRule): RuleActionDraft => {
    const actions = Array.isArray(rule.actions) ? rule.actions : [];
    if (actions.length === 0) {
        return {kind: "unknown", rawActions: []};
    }

    const firstAction = actions[0];
    const actionType = asString(firstAction.type);
    const target = asString(firstAction.target);
    if (!actionType || !target) {
        return {kind: "unknown", rawActions: actions};
    }

    const targetId = normalizeCapabilityId(target);
    const namespace = asString(firstAction.namespace) ?? "core.RWE";
    const params = asRecord(firstAction.params) ?? {};

    if (actionType === "SwitchOnWithOffTimer") {
        const timer = asRecord(params.switchOffDelayTime);
        return {
            kind: "switchTimer",
            target: targetId,
            namespace,
            delaySeconds: Math.max(0, Math.round(asNumber(timer?.value) ?? 0))
        };
    }

    if (actionType === "SetState") {
        const onState = asRecord(params.onState);
        if (typeof onState?.value === "boolean") {
            return {
                kind: "onState",
                target: targetId,
                namespace,
                value: Boolean(onState.value)
            };
        }
    }

    return {kind: "unknown", rawActions: actions};
};

const parseRuleDraft = (rule: InteractionRule): AutomationRuleDraft => {
    const trigger = parseTriggerDraft(rule);
    const action = parseActionDraft(rule);
    const editable = trigger.kind !== "unknown" && action.kind !== "unknown";

    return {
        id: rule.id,
        conditionEvaluationDelay: rule.conditionEvaluationDelay,
        constraints: Array.isArray(rule.constraints) ? rule.constraints : [],
        tags: rule.tags ?? {},
        trigger,
        action,
        editable,
        rawRule: editable ? undefined : rule
    };
};

export const createRuleDraftsFromInteraction = (interaction: Interaction): AutomationRuleDraft[] => {
    return (interaction.rules ?? []).map((rule) => parseRuleDraft(rule));
};

const buildButtonCondition = (buttonIndex: number) => ({
    type: "Equal",
    params: {
        leftOp: {
            desc: "/desc/function/GetEventProperty",
            type: "GetEventProperty",
            params: {
                eventPropertyName: {
                    desc: "/desc/function/Constant",
                    type: "Constant",
                    value: "index"
                }
            }
        },
        rightOp: {
            desc: "/desc/function/Constant",
            type: "Constant",
            value: Math.max(0, buttonIndex - 1)
        }
    }
});

const buildTrigger = (draft: RuleTriggerDraft): unknown[] => {
    if (draft.kind === "button") {
        return [{
            type: "Event",
            eventType: "ButtonPressed",
            namespace: draft.namespace || "core.RWE",
            source: withCapabilityPrefix(draft.source),
            conditions: [buildButtonCondition(draft.buttonIndex)]
        }];
    }

    if (draft.kind === "weekly") {
        return [{
            type: "Custom",
            subtype: "WeeklyTrigger",
            source: withCapabilityPrefix(draft.source),
            namespace: draft.namespace || "core.RWE",
            properties: {
                startTime: normalizeTime(draft.startTime),
                dayOfWeek: draft.dayOfWeek,
                recurrenceInterval: draft.recurrenceInterval
            }
        }];
    }

    return draft.rawTriggers;
};

const constantValue = (value: unknown) => ({
    desc: "/desc/function/Constant",
    type: "Constant",
    value
});

const chooseActionNamespace = (targetId: string, explicitNamespace: string, catalog: CapabilityCatalog): string => {
    if (explicitNamespace.trim().length > 0) return explicitNamespace;
    return catalog.byId.get(targetId)?.namespace ?? "core.RWE";
};

const buildAction = (draft: RuleActionDraft, catalog: CapabilityCatalog): InteractionAction[] => {
    if (draft.kind === "switchTimer") {
        return [{
            type: "SwitchOnWithOffTimer",
            namespace: chooseActionNamespace(draft.target, draft.namespace, catalog),
            target: withCapabilityPrefix(draft.target),
            params: {
                switchOffDelayTime: constantValue(Math.max(0, Math.round(draft.delaySeconds)))
            }
        }];
    }

    if (draft.kind === "onState") {
        return [{
            type: "SetState",
            namespace: chooseActionNamespace(draft.target, draft.namespace, catalog),
            target: withCapabilityPrefix(draft.target),
            params: {
                onState: constantValue(draft.value)
            }
        }];
    }

    if (draft.kind === "setpoint") {
        return [{
            type: "SetState",
            namespace: chooseActionNamespace(draft.target, draft.namespace, catalog),
            target: withCapabilityPrefix(draft.target),
            params: {
                setpointTemperature: constantValue(Math.max(6, Math.min(30, Math.round(draft.temperature * 2) / 2)))
            }
        }];
    }

    if (draft.kind === "notify") {
        return [{
            type: "SendNotification",
            namespace: chooseActionNamespace(draft.target, draft.namespace, catalog),
            target: withCapabilityPrefix(draft.target),
            params: draft.params
        }];
    }

    return draft.rawActions;
};

export const buildInteractionRulesFromDrafts = (drafts: AutomationRuleDraft[], catalog: CapabilityCatalog): InteractionRule[] => {
    return drafts
        .map((draft) => {
            if (!draft.editable && draft.rawRule) {
                return draft.rawRule;
            }

            return {
                id: draft.id,
                conditionEvaluationDelay: draft.conditionEvaluationDelay,
                constraints: draft.constraints ?? [],
                tags: draft.tags ?? {},
                triggers: buildTrigger(draft.trigger),
                actions: buildAction(draft.action, catalog)
            } satisfies InteractionRule;
        })
        .filter((rule) => {
            const triggers = Array.isArray(rule.triggers) ? rule.triggers : [];
            const actions = Array.isArray(rule.actions) ? rule.actions : [];
            return triggers.length > 0 && actions.length > 0;
        });
};

const readTopLevelCapabilities = (allThings?: AxiosDeviceResponse): Array<{id: string, type?: string, capabilityName?: string, deviceId?: string}> => {
    const topLevel = ((allThings as unknown as {
        capabilities?: Array<{id?: string, type?: string, config?: {name?: string}, device?: string}>
    })?.capabilities) ?? [];

    const results: Array<{id: string, type?: string, capabilityName?: string, deviceId?: string}> = [];
    for (const capability of topLevel) {
        const id = asString(capability.id);
        if (!id) continue;
        results.push({
            id,
            type: asString(capability.type),
            capabilityName: asString(capability.config?.name),
            deviceId: capability.device ? normalizeDeviceId(capability.device) : undefined
        });
    }
    return results;
};

export const buildCapabilityCatalog = (allThings?: AxiosDeviceResponse): CapabilityCatalog => {
    const deviceById = new Map<string, Device>();
    const deviceNameById = new Map<string, string>();
    const capabilityRecords = new Map<string, DeviceCapabilityRecord>();

    for (const device of Object.values(allThings?.devices ?? {}) as Device[]) {
        const deviceId = asString(device.id);
        if (!deviceId) continue;
        deviceById.set(deviceId, device);
        deviceNameById.set(deviceId, asString(device.config?.name) ?? deviceId);

        for (const capabilityData of (device.capabilityData ?? [])) {
            const capabilityId = asString(capabilityData.id);
            if (!capabilityId) continue;
            const previous = capabilityRecords.get(capabilityId);
            capabilityRecords.set(capabilityId, {
                id: capabilityId,
                type: asString(capabilityData.type) ?? previous?.type,
                capabilityName: asString(capabilityData.config?.name) ?? previous?.capabilityName,
                deviceId
            });
        }

        for (const capabilityRef of (device.capabilities ?? [])) {
            const capabilityId = normalizeCapabilityId(capabilityRef);
            if (!capabilityId) continue;
            const previous = capabilityRecords.get(capabilityId);
            capabilityRecords.set(capabilityId, {
                id: capabilityId,
                type: previous?.type,
                capabilityName: previous?.capabilityName,
                deviceId
            });
        }
    }

    for (const capability of readTopLevelCapabilities(allThings)) {
        const previous = capabilityRecords.get(capability.id);
        capabilityRecords.set(capability.id, {
            id: capability.id,
            type: capability.type ?? previous?.type,
            capabilityName: capability.capabilityName ?? previous?.capabilityName,
            deviceId: capability.deviceId ?? previous?.deviceId
        });
    }

    const options = Array.from(capabilityRecords.values())
        .map((record) => {
            const device = record.deviceId ? deviceById.get(record.deviceId) : undefined;
            const deviceName = record.deviceId ? deviceNameById.get(record.deviceId) : undefined;
            const capabilityName = record.capabilityName ?? record.id;
            const label = deviceName && capabilityName && capabilityName !== deviceName
                ? `${deviceName} (${capabilityName})`
                : (deviceName ?? capabilityName);

            return {
                id: record.id,
                label,
                type: record.type,
                deviceName,
                capabilityName,
                namespace: device?.product ?? "core.RWE"
            } satisfies CapabilityOption;
        })
        .sort((left, right) => left.label.localeCompare(right.label, "de"));

    const byId = new Map(options.map((option) => [option.id, option] as const));

    const byType = (matcher: (type?: string) => boolean): CapabilityOption[] => options.filter((option) => matcher(option.type));

    const buttonSources = byType((type) => type === "PushButtonSensor");
    const calendarSources = byType((type) => type === "Calendar");
    const switchTargets = byType((type) => type === "SwitchActuator" || type === "BooleanStateActuator");
    const setpointTargets = byType((type) => type === "RoomSetpoint" || type === "ThermostatActuator");
    const notifyTargets = byType((type) => type === "PushNotificationActuator" || type === "SmsActuator" || type === "EmailActuator");

    return {
        options,
        byId,
        buttonSources: buttonSources.length > 0 ? buttonSources : options,
        calendarSources: calendarSources.length > 0 ? calendarSources : options,
        switchTargets: switchTargets.length > 0 ? switchTargets : options,
        setpointTargets: setpointTargets.length > 0 ? setpointTargets : options,
        notifyTargets: notifyTargets.length > 0 ? notifyTargets : options
    };
};

const defaultSourceForTrigger = (kind: RuleTriggerDraft["kind"], catalog: CapabilityCatalog): string => {
    if (kind === "button") return catalog.buttonSources[0]?.id ?? catalog.options[0]?.id ?? "";
    if (kind === "weekly") return catalog.calendarSources[0]?.id ?? catalog.options[0]?.id ?? "";
    return catalog.options[0]?.id ?? "";
};

const defaultTargetForAction = (kind: RuleActionDraft["kind"], catalog: CapabilityCatalog): string => {
    if (kind === "switchTimer" || kind === "onState") return catalog.switchTargets[0]?.id ?? catalog.options[0]?.id ?? "";
    if (kind === "setpoint") return catalog.setpointTargets[0]?.id ?? catalog.options[0]?.id ?? "";
    if (kind === "notify") return catalog.notifyTargets[0]?.id ?? catalog.options[0]?.id ?? "";
    return catalog.options[0]?.id ?? "";
};

export const createDefaultRuleDraft = (catalog: CapabilityCatalog): AutomationRuleDraft => {
    const source = defaultSourceForTrigger("button", catalog);
    const target = defaultTargetForAction("onState", catalog);
    const targetNamespace = catalog.byId.get(target)?.namespace ?? "core.RWE";

    return {
        constraints: [],
        tags: {},
        editable: true,
        trigger: {
            kind: "button",
            source,
            namespace: "core.RWE",
            buttonIndex: 1
        },
        action: {
            kind: "onState",
            target,
            namespace: targetNamespace,
            value: false
        }
    };
};

export const switchTriggerKind = (draft: AutomationRuleDraft, kind: "button" | "weekly", catalog: CapabilityCatalog): AutomationRuleDraft => {
    const source = defaultSourceForTrigger(kind, catalog);
    const trigger: RuleTriggerDraft = kind === "button"
        ? {
            kind,
            source,
            namespace: "core.RWE",
            buttonIndex: 1
        }
        : {
            kind,
            source,
            namespace: "core.RWE",
            startTime: "06:00",
            dayOfWeek: DEFAULT_DAY_MASK,
            recurrenceInterval: DEFAULT_RECURRENCE
        };

    return {
        ...draft,
        editable: true,
        rawRule: undefined,
        trigger
    };
};

export const switchActionKind = (draft: AutomationRuleDraft, kind: "switchTimer" | "onState" | "setpoint" | "notify", catalog: CapabilityCatalog): AutomationRuleDraft => {
    const target = defaultTargetForAction(kind, catalog);
    const namespace = catalog.byId.get(target)?.namespace ?? "core.RWE";

    const action: RuleActionDraft =
        kind === "switchTimer"
            ? {kind, target, namespace, delaySeconds: 0}
            : kind === "onState"
                ? {kind, target, namespace, value: false}
                : kind === "setpoint"
                    ? {kind, target, namespace, temperature: 20}
                    : {kind, target, namespace, params: {}};

    return {
        ...draft,
        editable: true,
        rawRule: undefined,
        action
    };
};

const validTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const validateAutomationRuleDrafts = (drafts: AutomationRuleDraft[]): string | undefined => {
    if (drafts.length === 0) {
        return "Mindestens eine Regel ist erforderlich.";
    }

    for (let index = 0; index < drafts.length; index++) {
        const draft = drafts[index];
        if (!draft.editable) continue;

        if (draft.trigger.kind === "button") {
            if (!draft.trigger.source) return `Regel ${index + 1}: Kein Ausloeser-Geraet gewaehlt.`;
            if (draft.trigger.buttonIndex < 1 || draft.trigger.buttonIndex > 8) return `Regel ${index + 1}: Ungueltige Taste.`;
        }
        if (draft.trigger.kind === "weekly") {
            if (!draft.trigger.source) return `Regel ${index + 1}: Kein Zeit-Ausloeser gewaehlt.`;
            if (!validTime(draft.trigger.startTime)) return `Regel ${index + 1}: Zeitformat ungueltig.`;
        }

        if (draft.action.kind === "switchTimer") {
            if (!draft.action.target) return `Regel ${index + 1}: Kein Zielgeraet gewaehlt.`;
            if (draft.action.delaySeconds < 0) return `Regel ${index + 1}: Timer darf nicht negativ sein.`;
        }
        if (draft.action.kind === "onState") {
            if (!draft.action.target) return `Regel ${index + 1}: Kein Zielgeraet gewaehlt.`;
        }
        if (draft.action.kind === "setpoint") {
            if (!draft.action.target) return `Regel ${index + 1}: Kein Zielgeraet gewaehlt.`;
            if (draft.action.temperature < 6 || draft.action.temperature > 30) return `Regel ${index + 1}: Solltemperatur ausserhalb 6-30 °C.`;
        }
        if (draft.action.kind === "notify") {
            if (!draft.action.target) return `Regel ${index + 1}: Kein Benachrichtigungsziel gewaehlt.`;
        }
    }

    return undefined;
};

export const getDayMaskLabel = (value: number): string => dayMaskLabelMap[value] ?? `Tagesmaske ${value}`;
