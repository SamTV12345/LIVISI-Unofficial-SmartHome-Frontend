import {Interaction, InteractionAction, InteractionRule} from "@/models/Interaction";
import {AxiosDeviceResponse} from "@/store/store";
import {Device} from "@/models/Device";

export type AutomationRulePreview = {
    whenChips: string[];
    thenChips: string[];
    triggerCount: number;
    actionCount: number;
};

type CapabilityPresentation = {
    name: string;
    deviceName?: string;
    deviceId?: string;
};

export type AutomationPresentationLookup = {
    capabilityById: Map<string, CapabilityPresentation>;
    deviceNameById: Map<string, string>;
};

const CATEGORY_LABELS: Record<string, string> = {
    LightingId: "Beleuchtung",
    ClimateId: "Klima",
    EntertainmentId: "Unterhaltung",
    SecurityId: "Sicherheit",
    StatesId: "Zustände",
    DoorsId: "Türen und Fenster",
    OutsideId: "Außen",
    EnergyId: "Energie",
    HouseholdId: "Haushalt",
    HealthId: "Gesundheit"
};

const EVENT_LABELS: Record<string, string> = {
    ButtonPressed: "Tastendruck",
    StateChanged: "Statusänderung"
};

const ACTION_LABELS: Record<string, string> = {
    SwitchOnWithOffTimer: "Einschalten mit Timer",
    SetState: "Status setzen",
    SendNotification: "Benachrichtigung",
    Execute: "Ausführen"
};

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value as Record<string, unknown>;
};

const toStringValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "on", "active", "enabled"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "off", "inactive", "disabled"].includes(normalized)) {
            return false;
        }
    }
    return undefined;
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

const normalizeCapabilityId = (value: string): string => value.replace(/^\/+/, "").replace(/^capability\//i, "");
const normalizeDeviceId = (value: string): string => value.replace(/^\/+/, "").replace(/^device\//i, "");

const normalizeResourceLabel = (value: string): string => {
    return value
        .replace(/^\/+/, "")
        .replace(/^interaction\//i, "")
        .replace(/^device\//i, "")
        .replace(/^capability\//i, "");
};

const humanizeIdentifier = (value: string): string => {
    return value
        .replace(/Id$/, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
};

export const buildAutomationPresentationLookup = (allThings?: AxiosDeviceResponse): AutomationPresentationLookup => {
    const capabilityById = new Map<string, CapabilityPresentation>();
    const deviceNameById = new Map<string, string>();

    const devices = Object.values(allThings?.devices ?? {}) as Device[];
    for (const device of devices) {
        const deviceId = toStringValue(device.id);
        const deviceName = toStringValue(device.config?.name) ?? deviceId;
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

        const capabilityData = Array.isArray(device.capabilityData) ? device.capabilityData : [];
        for (const capability of capabilityData) {
            const capabilityId = toStringValue(capability.id);
            if (!capabilityId) continue;
            const previous = capabilityById.get(capabilityId);
            capabilityById.set(capabilityId, {
                name: toStringValue(capability.config?.name) ?? capabilityId,
                deviceName: previous?.deviceName ?? deviceName,
                deviceId: previous?.deviceId ?? deviceId
            });
        }
    }

    for (const capability of (allThings?.capabilities ?? [])) {
        const capabilityId = toStringValue(capability.id);
        if (!capabilityId) continue;
        const previous = capabilityById.get(capabilityId);
        const deviceId = capability.device ? normalizeDeviceId(capability.device) : previous?.deviceId;
        const deviceName = deviceId ? deviceNameById.get(deviceId) : previous?.deviceName;
        capabilityById.set(capabilityId, {
            name: toStringValue(capability.config?.name) ?? previous?.name ?? capabilityId,
            deviceName: deviceName ?? previous?.deviceName,
            deviceId: deviceId ?? previous?.deviceId
        });
    }

    return {
        capabilityById,
        deviceNameById
    };
};

const formatSourceLabel = (source: string, lookup?: AutomationPresentationLookup): string => {
    const capabilityId = normalizeCapabilityId(source);
    const capability = lookup?.capabilityById.get(capabilityId) ?? lookup?.capabilityById.get(source);
    if (capability?.deviceName) {
        return capability.deviceName;
    }
    if (capability?.name) {
        return capability.name;
    }

    const deviceId = normalizeDeviceId(source);
    const deviceName = lookup?.deviceNameById.get(deviceId) ?? lookup?.deviceNameById.get(source);
    if (deviceName) {
        return deviceName;
    }

    return normalizeResourceLabel(source);
};

const summarizeTriggerChips = (trigger: unknown, lookup?: AutomationPresentationLookup): string[] => {
    const triggerRecord = toRecord(trigger);
    if (!triggerRecord) {
        return ["Auslöser"];
    }

    const eventTypeRaw = toStringValue(triggerRecord.eventType);
    const source = toStringValue(triggerRecord.source) ?? toStringValue(triggerRecord.target) ?? toStringValue(triggerRecord.id);
    const subtype = toStringValue(triggerRecord.subtype);
    const eventType = eventTypeRaw ? (EVENT_LABELS[eventTypeRaw] ?? humanizeIdentifier(eventTypeRaw)) : undefined;

    if (subtype === "WeeklyTrigger") {
        const properties = toRecord(triggerRecord.properties);
        const startTime = toStringValue(properties?.startTime)?.slice(0, 5);
        return ["Zeitplan", startTime ?? "Zeitpunkt"];
    }

    if (eventType && source) {
        return [eventType, formatSourceLabel(source, lookup)];
    }

    if (eventType) {
        return [eventType];
    }

    if (source) {
        return [formatSourceLabel(source, lookup)];
    }

    const rawType = toStringValue(triggerRecord.type);
    if (rawType) {
        return [humanizeIdentifier(rawType)];
    }

    return ["Auslöser"];
};

const summarizeSetStateAction = (action: InteractionAction, targetLabel?: string): string[] | undefined => {
    const params = toRecord(action.params);
    if (!params) return undefined;

    const setpoint = toRecord(params.setpointTemperature);
    const setpointValue = toNumber(setpoint?.value);
    if (setpointValue !== undefined) {
        if (targetLabel) {
            return ["Temperatur", targetLabel, `Soll ${setpointValue.toFixed(1)} C`];
        }
        return ["Temperatur", `Soll ${setpointValue.toFixed(1)} C`];
    }

    const onState = toRecord(params.onState);
    const onStateValue = toBoolean(onState?.value);
    if (onStateValue !== undefined) {
        if (targetLabel) {
            return ["AN/AUS", targetLabel, onStateValue ? "Einschalten" : "Ausschalten"];
        }
        return ["AN/AUS", onStateValue ? "Einschalten" : "Ausschalten"];
    }

    return undefined;
};

const summarizeActionChips = (action: InteractionAction, lookup?: AutomationPresentationLookup): string[] => {
    const actionTypeRaw = toStringValue(action.type);
    const actionType = actionTypeRaw ? (ACTION_LABELS[actionTypeRaw] ?? humanizeIdentifier(actionTypeRaw)) : undefined;
    const target = toStringValue(action.target);
    const targetLabel = target ? formatSourceLabel(target, lookup) : undefined;

    if (actionTypeRaw === "SetState") {
        const setState = summarizeSetStateAction(action, targetLabel);
        if (setState) {
            return setState;
        }
    }

    if (actionTypeRaw === "SwitchOnWithOffTimer") {
        const params = toRecord(action.params);
        const timerRecord = toRecord(params?.switchOffDelayTime);
        const timer = toNumber(timerRecord?.value);
        if (targetLabel && timer !== undefined) {
            return ["AN/AUS", targetLabel, `Timer ${Math.round(timer)}s`];
        }
        if (targetLabel) {
            return ["AN/AUS", targetLabel, "Timer"];
        }
    }

    if (actionType && targetLabel) {
        return [actionType, targetLabel];
    }

    if (actionType) {
        return [actionType];
    }

    if (targetLabel) {
        return [targetLabel];
    }

    return ["Aktion"];
};

export const summarizeRule = (rule: InteractionRule, lookup?: AutomationPresentationLookup): AutomationRulePreview => {
    const triggerEntries = Array.isArray(rule.triggers) ? rule.triggers : [];
    const constraintEntries = Array.isArray(rule.constraints) ? rule.constraints : [];
    const actionEntries = Array.isArray(rule.actions) ? rule.actions : [];

    const whenChips = [
        ...triggerEntries.flatMap((entry) => summarizeTriggerChips(entry, lookup)),
        ...constraintEntries.flatMap((entry) => summarizeTriggerChips(entry, lookup))
    ];
    const thenChips = actionEntries.flatMap((entry) => summarizeActionChips(entry, lookup));

    return {
        whenChips: whenChips.filter((value, index, self) => self.indexOf(value) === index),
        thenChips: thenChips.filter((value, index, self) => self.indexOf(value) === index),
        triggerCount: triggerEntries.length + constraintEntries.length,
        actionCount: actionEntries.length
    };
};

export const summarizeInteraction = (interaction: Interaction, lookup?: AutomationPresentationLookup) => {
    const rulePreviews = (interaction.rules ?? []).map((rule) => summarizeRule(rule, lookup));
    return {
        rulePreviews,
        totalRuleCount: rulePreviews.length,
        totalTriggerCount: rulePreviews.reduce((sum, rule) => sum + rule.triggerCount, 0),
        totalActionCount: rulePreviews.reduce((sum, rule) => sum + rule.actionCount, 0)
    };
};

export const readAutomationCategory = (interaction: Interaction): string => {
    const rawCategory = toStringValue(interaction.tags?.category ?? interaction.tags?.group);
    if (!rawCategory) {
        return "Ohne Kategorie";
    }
    return CATEGORY_LABELS[rawCategory] ?? humanizeIdentifier(rawCategory) ?? rawCategory;
};

const BOOLEAN_KEYS = ["enabled", "isEnabled", "isActive", "scenarioActive"];

const readBooleanFromRecord = (
    source: Record<string, unknown> | undefined,
    candidates: string[]
): {key: string; value: boolean} | undefined => {
    if (!source) return undefined;
    for (const key of candidates) {
        const value = toBoolean(source[key]);
        if (value !== undefined) {
            return {key, value};
        }
    }
    return undefined;
};

const readAutomationBooleanBinding = (interaction: Interaction): boolean | undefined => {
    const interactionRecord = toRecord(interaction as unknown);
    const topLevel = readBooleanFromRecord(interactionRecord, BOOLEAN_KEYS);
    if (topLevel) {
        return topLevel.value;
    }

    const tagsRecord = toRecord(interaction.tags as unknown);
    const tags = readBooleanFromRecord(tagsRecord, BOOLEAN_KEYS);
    if (tags) {
        return tags.value;
    }

    return undefined;
};

const readAutomationValidityBinding = (interaction: Interaction): boolean | undefined => {
    const validFromRaw = toStringValue(interaction.validFrom);
    const validToRaw = toStringValue(interaction.validTo);

    if (!validFromRaw && !validToRaw) {
        return undefined;
    }

    const now = Date.now();

    if (validFromRaw) {
        const validFromTs = Date.parse(validFromRaw);
        if (!Number.isNaN(validFromTs) && now < validFromTs) {
            return false;
        }
    }

    if (validToRaw) {
        const validToTs = Date.parse(validToRaw);
        if (!Number.isNaN(validToTs) && now > validToTs) {
            return false;
        }
    }

    return true;
};

const readActionSetBoolean = (action: InteractionAction): boolean | undefined => {
    if (toStringValue(action.type) === "SwitchOnWithOffTimer") {
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

const BOOLEAN_ACTUATOR_CAPABILITY_TYPES = new Set(["BooleanStateActuator", "SwitchActuator"]);

const isBooleanStateActuatorCapability = (allThings: AxiosDeviceResponse | undefined, capabilityId: string): boolean => {
    if (!allThings) return false;

    const normalizedCapabilityId = normalizeCapabilityId(capabilityId);
    const topLevelMatch = (allThings.capabilities ?? []).find(
        (capability) => normalizeCapabilityId(capability.id ?? "") === normalizedCapabilityId
    );
    if (topLevelMatch?.type && BOOLEAN_ACTUATOR_CAPABILITY_TYPES.has(topLevelMatch.type)) {
        return true;
    }

    const devices = Object.values(allThings.devices ?? {}) as Device[];
    for (const device of devices) {
        const deviceTags = toRecord(device.tags as unknown);
        const internalStateId = toStringValue(deviceTags?.internalStateId);
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
        capabilityId: string;
        setsTo?: boolean;
    };

    const candidates: Candidate[] = [];
    for (const rule of (interaction.rules ?? [])) {
        for (const action of (rule.actions ?? [])) {
            const target = toStringValue(action.target);
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

export const readAutomationState = (
    interaction: Interaction,
    allThings?: AxiosDeviceResponse
): "Aktiv" | "Inaktiv" | "Unbekannt" => {
    const validityBinding = readAutomationValidityBinding(interaction);
    if (validityBinding !== undefined) {
        return validityBinding ? "Aktiv" : "Inaktiv";
    }

    const directBinding = readAutomationBooleanBinding(interaction);
    if (directBinding !== undefined) {
        return directBinding ? "Aktiv" : "Inaktiv";
    }

    const stateCapabilityValue = readStateCapabilityBinding(interaction, allThings);
    if (stateCapabilityValue !== undefined) {
        return stateCapabilityValue ? "Aktiv" : "Inaktiv";
    }

    return "Aktiv";
};
