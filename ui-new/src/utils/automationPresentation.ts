import {Interaction, InteractionAction, InteractionRule} from "@/src/models/Interaction.ts";
import {AxiosDeviceResponse} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";

export type AutomationRulePreview = {
    whenChips: string[],
    thenChips: string[],
    triggerCount: number,
    actionCount: number
}

type CapabilityPresentation = {
    name: string,
    deviceName?: string,
    deviceId?: string
};

export type AutomationPresentationLookup = {
    capabilityById: Map<string, CapabilityPresentation>,
    deviceNameById: Map<string, string>
};

export type AutomationWritableBinding = {
    container: "interaction" | "tags",
    key: string,
    value: boolean
};

const CATEGORY_LABELS: Record<string, string> = {
    LightingId: "Beleuchtung",
    ClimateId: "Klima",
    EntertainmentId: "Unterhaltung",
    SecurityId: "Sicherheit",
    StatesId: "Zustaende",
    DoorsId: "Tueren & Fenster",
    OutsideId: "Aussen",
    EnergyId: "Energie",
    HouseholdId: "Haushalt",
    HealthId: "Gesundheit"
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    ButtonPressed: "Tastendruck",
    StateChanged: "Statusaenderung"
};

const ACTION_TYPE_LABELS: Record<string, string> = {
    SwitchOnWithOffTimer: "Einschalten mit Abschalttimer",
    SetState: "Status setzen",
    SendNotification: "Benachrichtigung senden",
    SetTrigger: "Ausloeser setzen",
    Execute: "Ausfuehren"
};

const readStringValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value as Record<string, unknown>;
};

const toNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "on", "enabled", "active"].includes(normalized)) return true;
        if (["false", "0", "off", "disabled", "inactive"].includes(normalized)) return false;
    }
    return undefined;
};

const normalizeResourceLabel = (value: string): string => {
    const cleaned = value
        .replace(/^\/+/, "")
        .replace(/^interaction\//i, "")
        .replace(/^device\//i, "")
        .replace(/^capability\//i, "");
    if (cleaned.length === 0) {
        return value;
    }
    if (cleaned.length > 22) {
        return cleaned.slice(0, 22) + "...";
    }
    return cleaned;
};

const normalizeCapabilityId = (value: string): string => value.replace(/^\/+/, "").replace(/^capability\//i, "");
const normalizeDeviceId = (value: string): string => value.replace(/^\/+/, "").replace(/^device\//i, "");

const humanizeIdentifier = (value: string): string => {
    return value
        .replace(/Id$/, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
};

const dayMaskLabel = (value: unknown): string | undefined => {
    const numeric = toNumber(value);
    if (numeric === undefined) return undefined;
    const dayMask = Math.round(numeric);
    const map: Record<number, string> = {
        127: "jeden Tag",
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
    return map[dayMask] ?? `Tagmaske ${dayMask}`;
};

const readButtonIndex = (triggerObject: Record<string, unknown>): number | undefined => {
    const conditions = triggerObject.conditions;
    if (!Array.isArray(conditions)) return undefined;

    for (const condition of conditions) {
        const conditionObject = toRecord(condition);
        const params = toRecord(conditionObject?.params);
        const leftOp = toRecord(params?.leftOp);
        const leftOpParams = toRecord(leftOp?.params);
        const eventPropertyName = toRecord(leftOpParams?.eventPropertyName);
        const eventPropertyValue = readStringValue(eventPropertyName?.value);
        if (eventPropertyValue !== "index") continue;

        const rightOp = toRecord(params?.rightOp);
        const rightValue = toNumber(rightOp?.value);
        if (rightValue === undefined) continue;
        return Math.round(rightValue) + 1;
    }

    return undefined;
};

const formatSourceLabel = (source: string, lookup?: AutomationPresentationLookup): string => {
    const capabilityId = normalizeCapabilityId(source);
    const capability = lookup?.capabilityById.get(capabilityId) ?? lookup?.capabilityById.get(source);
    if (capability) {
        return capability.deviceName || capability.name || normalizeResourceLabel(source);
    }

    const deviceId = normalizeDeviceId(source);
    const deviceName = lookup?.deviceNameById.get(deviceId) ?? lookup?.deviceNameById.get(source);
    if (deviceName) return deviceName;

    return normalizeResourceLabel(source);
};

const readSetpointLabel = (action: InteractionAction): string | undefined => {
    const params = toRecord(action.params);
    const setpoint = toRecord(params?.setpointTemperature);
    const value = toNumber(setpoint?.value);
    if (value === undefined) return undefined;
    return `Solltemperatur ${value.toFixed(1)} °C`;
};

const readOnStateLabel = (action: InteractionAction): string | undefined => {
    const params = toRecord(action.params);
    const onState = toRecord(params?.onState);
    const value = toBoolean(onState?.value);
    if (value === undefined) return undefined;
    return value ? "Einschalten" : "Ausschalten";
};

const readSwitchDelayLabel = (action: InteractionAction): string | undefined => {
    const params = toRecord(action.params);
    const delay = toRecord(params?.switchOffDelayTime);
    const delaySeconds = toNumber(delay?.value);
    if (delaySeconds === undefined || delaySeconds <= 0) return undefined;
    return `${Math.round(delaySeconds)}s`;
};

const readField = (source: Record<string, unknown>, candidates: string[]): string | undefined => {
    for (const key of candidates) {
        const candidate = readStringValue(source[key]);
        if (candidate) {
            return candidate;
        }
    }
    return undefined;
};

const readBooleanFromRecord = (source: Record<string, unknown>, candidates: string[]): {key: string, value: boolean} | undefined => {
    for (const key of candidates) {
        const value = toBoolean(source[key]);
        if (value !== undefined) {
            return {key, value};
        }
    }
    return undefined;
};

const BOOLEAN_STATE_KEYS = ["enabled", "isEnabled", "isActive", "scenarioActive", "active"];

const readAutomationBooleanBinding = (interaction: Interaction): AutomationWritableBinding | undefined => {
    const interactionRecord = toRecord(interaction as unknown);
    if (interactionRecord) {
        const match = readBooleanFromRecord(interactionRecord, BOOLEAN_STATE_KEYS);
        if (match) {
            return {
                container: "interaction",
                key: match.key,
                value: match.value
            };
        }
    }

    const tags = interaction.tags as Record<string, unknown> | undefined;
    if (tags) {
        const match = readBooleanFromRecord(tags, BOOLEAN_STATE_KEYS);
        if (match) {
            return {
                container: "tags",
                key: match.key,
                value: match.value
            };
        }
    }

    return undefined;
};

const readActionSetBoolean = (action: InteractionAction): boolean | undefined => {
    if (readStringValue(action.type) === "SwitchOnWithOffTimer") {
        return true;
    }

    const params = toRecord(action.params);
    if (!params) return undefined;

    const directValue = toBoolean(params.value);
    if (directValue !== undefined) return directValue;

    const valueItem = toRecord(params.value);
    const nestedValue = toBoolean(valueItem?.value);
    if (nestedValue !== undefined) return nestedValue;

    const onStateItem = toRecord(params.onState);
    const onStateValue = toBoolean(onStateItem?.value);
    if (onStateValue !== undefined) return onStateValue;

    return toBoolean(params.onState);
};

const BOOLEAN_ACTUATOR_CAPABILITY_TYPES = new Set(["BooleanStateActuator", "SwitchActuator"]);

const readBooleanFromStateEntry = (state: unknown): boolean | undefined => {
    const stateRecord = toRecord(state);
    if (!stateRecord) {
        return undefined;
    }

    const preferredKeys = ["value", "onState", "isOn", "isActive", "active", "state"];
    for (const key of preferredKeys) {
        const direct = toBoolean(stateRecord[key]);
        if (direct !== undefined) return direct;
        const nested = toRecord(stateRecord[key]);
        const nestedValue = toBoolean(nested?.value);
        if (nestedValue !== undefined) return nestedValue;
    }

    for (const value of Object.values(stateRecord)) {
        const direct = toBoolean(value);
        if (direct !== undefined) return direct;
        const nested = toRecord(value);
        const nestedValue = toBoolean(nested?.value);
        if (nestedValue !== undefined) return nestedValue;
    }

    return undefined;
};

const readCapabilityStateBoolean = (allThings: AxiosDeviceResponse | undefined, capabilityId: string): boolean | undefined => {
    if (!allThings) return undefined;

    const normalizedCapabilityId = normalizeCapabilityId(capabilityId);
    const devices = Object.values(allThings.devices ?? {}) as Device[];

    for (const device of devices) {
        const entries = Array.isArray(device.capabilityState) ? device.capabilityState : [];
        const matchingEntry = entries.find((entry) => normalizeCapabilityId(entry.id) === normalizedCapabilityId);
        if (!matchingEntry) continue;
        const value = readBooleanFromStateEntry(matchingEntry.state);
        if (value !== undefined) {
            return value;
        }
    }

    return undefined;
};

const isBooleanStateActuatorCapability = (allThings: AxiosDeviceResponse | undefined, capabilityId: string): boolean => {
    if (!allThings) return false;

    const normalizedCapabilityId = normalizeCapabilityId(capabilityId);
    const topLevelCapabilities = ((allThings as unknown as {
        capabilities?: Array<{id?: string, type?: string}>
    }).capabilities) ?? [];

    const topLevelMatch = topLevelCapabilities.find((capability) => normalizeCapabilityId(capability.id ?? "") === normalizedCapabilityId);
    if (topLevelMatch?.type && BOOLEAN_ACTUATOR_CAPABILITY_TYPES.has(topLevelMatch.type)) {
        return true;
    }

    const devices = Object.values(allThings.devices ?? {}) as Device[];
    for (const device of devices) {
        const deviceTags = toRecord(device.tags as unknown);
        const internalStateId = readStringValue(deviceTags?.internalStateId);
        if (!internalStateId) {
            continue;
        }

        const capabilityRefs = Array.isArray(device.capabilities) ? device.capabilities : [];
        if (capabilityRefs.some((capabilityRef) => normalizeCapabilityId(capabilityRef) === normalizedCapabilityId)) {
            return true;
        }

        const capabilityData = Array.isArray(device.capabilityData) ? device.capabilityData : [];
        if (capabilityData.some((capability) => {
            if (normalizeCapabilityId(capability.id) !== normalizedCapabilityId) {
                return false;
            }
            if (capability.type && BOOLEAN_ACTUATOR_CAPABILITY_TYPES.has(capability.type)) {
                return true;
            }
            return Boolean(internalStateId);
        })) {
            return true;
        }
    }

    return false;
};

const readStateCapabilityBinding = (interaction: Interaction, allThings?: AxiosDeviceResponse): boolean | undefined => {
    if (!allThings) return undefined;

    type Candidate = {
        capabilityId: string,
        setsTo?: boolean
    };

    const candidates: Candidate[] = [];
    for (const rule of (interaction.rules ?? [])) {
        for (const action of (rule.actions ?? [])) {
            const target = readStringValue(action.target);
            if (!target) continue;
            const capabilityId = normalizeCapabilityId(target);
            if (!capabilityId) continue;
            const setsTo = readActionSetBoolean(action);
            const capabilityLooksBoolean = isBooleanStateActuatorCapability(allThings, capabilityId);
            if (!capabilityLooksBoolean && setsTo === undefined) continue;
            candidates.push({
                capabilityId,
                setsTo
            });
        }
    }

    if (candidates.length === 0) {
        return undefined;
    }

    const evaluations: boolean[] = [];

    for (const candidate of candidates) {
        const currentValue = readCapabilityStateBoolean(allThings, candidate.capabilityId);
        if (currentValue === undefined) {
            continue;
        }

        if (candidate.setsTo !== undefined) {
            evaluations.push(currentValue === candidate.setsTo);
            continue;
        }

        evaluations.push(currentValue);
    }

    if (evaluations.length === 0) {
        return undefined;
    }

    if (evaluations.includes(false)) {
        return false;
    }

    return true;
};

export const buildAutomationPresentationLookup = (allThings?: AxiosDeviceResponse): AutomationPresentationLookup => {
    const capabilityById = new Map<string, CapabilityPresentation>();
    const deviceNameById = new Map<string, string>();

    const devices = Object.values(allThings?.devices ?? {}) as Device[];
    for (const device of devices) {
        const deviceId = readStringValue(device.id);
        const deviceName = readStringValue(device.config?.name) ?? deviceId;
        if (deviceId && deviceName) {
            deviceNameById.set(deviceId, deviceName);
        }

        for (const capabilityRef of (device.capabilities ?? [])) {
            const capabilityId = normalizeCapabilityId(capabilityRef);
            if (!capabilityId) continue;
            const previous = capabilityById.get(capabilityId);
            capabilityById.set(capabilityId, {
                name: previous?.name ?? capabilityId,
                deviceName: previous?.deviceName ?? deviceName,
                deviceId: previous?.deviceId ?? deviceId
            });
        }

        const capabilities = Array.isArray(device.capabilityData) ? device.capabilityData : [];
        for (const capability of capabilities) {
            const capabilityId = readStringValue(capability.id);
            if (!capabilityId) continue;
            const previous = capabilityById.get(capabilityId);
            capabilityById.set(capabilityId, {
                name: readStringValue(capability.config?.name) ?? capabilityId,
                deviceName: previous?.deviceName ?? deviceName,
                deviceId: previous?.deviceId ?? deviceId
            });
        }
    }

    const topLevelCapabilities = ((allThings as unknown as {
        capabilities?: Array<{
            id?: string,
            device?: string,
            config?: {name?: string}
        }>
    })?.capabilities) ?? [];

    for (const capability of topLevelCapabilities) {
        const capabilityId = readStringValue(capability.id);
        if (!capabilityId) continue;

        const previous = capabilityById.get(capabilityId);
        const deviceId = capability.device ? normalizeDeviceId(capability.device) : previous?.deviceId;
        const deviceName = deviceId ? deviceNameById.get(deviceId) : previous?.deviceName;
        const capabilityName = readStringValue(capability.config?.name) ?? previous?.name ?? capabilityId;

        capabilityById.set(capabilityId, {
            name: capabilityName,
            deviceName: deviceName ?? previous?.deviceName,
            deviceId: deviceId ?? previous?.deviceId
        });
    }

    return {
        capabilityById,
        deviceNameById
    };
};

const summarizeTriggerChips = (trigger: unknown, lookup?: AutomationPresentationLookup): string[] => {
    if (!trigger || typeof trigger !== "object") {
        return ["Ausloeser"];
    }

    const triggerObject = trigger as Record<string, unknown>;
    const triggerType = readField(triggerObject, ["type"]);
    const eventTypeRaw = readField(triggerObject, ["eventType", "event_type"]);
    const eventType = eventTypeRaw ? (EVENT_TYPE_LABELS[eventTypeRaw] ?? humanizeIdentifier(eventTypeRaw)) : undefined;
    const source = readField(triggerObject, ["source", "target", "id"]);
    const subtype = readField(triggerObject, ["subtype"]);
    const sourceLabel = source ? formatSourceLabel(source, lookup) : undefined;

    if (subtype === "WeeklyTrigger") {
        const properties = toRecord(triggerObject.properties);
        const startTime = readField(properties ?? {}, ["startTime"]);
        const dayLabel = dayMaskLabel(properties?.dayOfWeek);
        const timeChip = startTime ? startTime.slice(0, 5) : "Zeitplan";
        const chips = ["Zeitpunkt", "Zeitpunkt erreicht", timeChip];
        if (dayLabel) chips.push(dayLabel);
        return chips;
    }

    if (eventType && sourceLabel) {
        const buttonIndex = readButtonIndex(triggerObject);
        if (eventType === "Tastendruck" && buttonIndex !== undefined) {
            return ["Tastendruck", sourceLabel, `Taste ${buttonIndex} gedrueckt`];
        }
        return [eventType, sourceLabel];
    }

    if (eventType) {
        const buttonIndex = readButtonIndex(triggerObject);
        if (eventType === "Tastendruck" && buttonIndex !== undefined) {
            return ["Tastendruck", `Taste ${buttonIndex} gedrueckt`];
        }
        return [eventType];
    }

    if (source) {
        return [sourceLabel ?? normalizeResourceLabel(source)];
    }
    if (triggerType) {
        return [humanizeIdentifier(triggerType)];
    }

    return ["Ausloeser"];
};

const summarizeActionChips = (action: InteractionAction, lookup?: AutomationPresentationLookup): string[] => {
    const tags = action.tags ?? {};
    const labelFromTag = readField(tags, ["name", "label", "description"]);
    if (labelFromTag) {
        return [labelFromTag];
    }

    const actionTypeRaw = readStringValue(action.type);
    const actionType = actionTypeRaw ? (ACTION_TYPE_LABELS[actionTypeRaw] ?? humanizeIdentifier(actionTypeRaw)) : undefined;
    const actionTarget = readStringValue(action.target);
    const actionTargetLabel = actionTarget ? formatSourceLabel(actionTarget, lookup) : undefined;

    if (actionTypeRaw === "SetState") {
        const setpointLabel = readSetpointLabel(action);
        if (setpointLabel && actionTargetLabel) {
            return ["Temperatur", actionTargetLabel, setpointLabel];
        }
        if (setpointLabel) {
            return ["Temperatur", setpointLabel];
        }

        const onStateLabel = readOnStateLabel(action);
        if (onStateLabel && actionTargetLabel) {
            return ["AN/AUS", actionTargetLabel, onStateLabel];
        }
        if (onStateLabel) {
            return ["AN/AUS", onStateLabel];
        }
    }

    if (actionTypeRaw === "SwitchOnWithOffTimer") {
        const delayLabel = readSwitchDelayLabel(action);
        if (delayLabel && actionTargetLabel) {
            return ["AN/AUS", actionTargetLabel, "Einschalten", `Timer ${delayLabel}`];
        }
        if (actionTargetLabel) {
            return ["AN/AUS", actionTargetLabel, "Einschalten"];
        }
    }

    if (actionType && actionTargetLabel) {
        return [actionType, actionTargetLabel];
    }
    if (actionType) {
        return [actionType];
    }
    if (actionTarget) {
        return [actionTargetLabel ?? normalizeResourceLabel(actionTarget)];
    }

    return ["Aktion"];
};

export const summarizeRule = (rule: InteractionRule, lookup?: AutomationPresentationLookup): AutomationRulePreview => {
    const triggerEntries = Array.isArray(rule.triggers) ? rule.triggers : [];
    const constraintEntries = Array.isArray(rule.constraints) ? rule.constraints : [];
    const actionEntries = Array.isArray(rule.actions) ? rule.actions : [];

    const whenChips = [
        ...triggerEntries.flatMap((trigger) => summarizeTriggerChips(trigger, lookup)),
        ...constraintEntries.flatMap((constraint) => summarizeTriggerChips(constraint, lookup))
    ];
    const thenChips = actionEntries.flatMap((action) => summarizeActionChips(action, lookup));

    return {
        whenChips: whenChips.filter((value, index, self) => self.indexOf(value) === index),
        thenChips: thenChips.filter((value, index, self) => self.indexOf(value) === index),
        triggerCount: triggerEntries.length + constraintEntries.length,
        actionCount: actionEntries.length
    };
};

export const summarizeInteraction = (interaction: Interaction, lookup?: AutomationPresentationLookup) => {
    const rulePreviews = (interaction.rules ?? []).map((rule) => summarizeRule(rule, lookup));
    const totalTriggerCount = rulePreviews.reduce((sum, rule) => sum + rule.triggerCount, 0);
    const totalActionCount = rulePreviews.reduce((sum, rule) => sum + rule.actionCount, 0);
    return {
        rulePreviews,
        totalTriggerCount,
        totalActionCount,
        totalRuleCount: rulePreviews.length
    };
};

export const readAutomationCategory = (interaction: Interaction): string => {
    const tags = interaction.tags ?? {};
    const rawCategory = readField(tags, ["category", "group", "categoryName", "uiCategory"]);
    if (!rawCategory) {
        return "Ohne Kategorie";
    }

    if (CATEGORY_LABELS[rawCategory]) {
        return CATEGORY_LABELS[rawCategory];
    }

    return (
        humanizeIdentifier(rawCategory) ||
        rawCategory
    );
};

export const readAutomationWritableStateBinding = (interaction: Interaction): AutomationWritableBinding | undefined => {
    return readAutomationBooleanBinding(interaction);
};

export const readAutomationState = (
    interaction: Interaction,
    allThings?: AxiosDeviceResponse
): "Aktiv" | "Inaktiv" | "Unbekannt" => {
    const directBinding = readAutomationBooleanBinding(interaction);
    if (directBinding) {
        return directBinding.value ? "Aktiv" : "Inaktiv";
    }

    const stateCapabilityValue = readStateCapabilityBinding(interaction, allThings);
    if (stateCapabilityValue !== undefined) {
        return stateCapabilityValue ? "Aktiv" : "Inaktiv";
    }

    return "Unbekannt";
};
