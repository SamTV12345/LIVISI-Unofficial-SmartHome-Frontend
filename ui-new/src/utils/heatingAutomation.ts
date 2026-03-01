import {Interaction, InteractionAction, InteractionRule} from "@/src/models/Interaction.ts";

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_BASE_TEMPERATURE = 20;
const DEFAULT_DAY_MASK = 127;
const BASE_TEMPERATURE_TAG_PREFIX = "baseTemperatureId_";

type RulePoint = {
    startMinutes: number,
    temperature: number
};

export type HeatingPeriod = {
    id: string,
    startMinutes: number,
    endMinutes: number,
    temperature: number
};

export type HeatingDaySchedule = {
    dayMask: number,
    baseTemperature: number,
    periods: HeatingPeriod[],
    targetCapability?: string,
    triggerSource?: string,
    triggerNamespace?: string,
    actionNamespace?: string,
    recurrenceInterval?: number
};

export type HeatingTimelineSegment = {
    startMinutes: number,
    endMinutes: number,
    temperature: number
};

type WeeklyTriggerRecord = {
    type?: string,
    subtype?: string,
    source?: string,
    namespace?: string,
    properties?: Record<string, unknown>
};

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

const asInteger = (value: unknown): number | undefined => {
    const parsed = asNumber(value);
    if (parsed === undefined) return undefined;
    return Math.round(parsed);
};

const asString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeTemperature = (value: number): number => {
    const clamped = Math.max(6, Math.min(30, value));
    return Math.round(clamped * 2) / 2;
};

const clampMinute = (minute: number): number => {
    return Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minute)));
};

const parseMinuteValue = (timeValue: string): number | undefined => {
    const fragments = timeValue.split(":");
    if (fragments.length < 2) return undefined;
    const hour = Number.parseInt(fragments[0], 10);
    const minute = Number.parseInt(fragments[1], 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return undefined;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;
    return hour * 60 + minute;
};

const formatTime = (minutes: number, withSeconds: boolean): string => {
    const safe = clampMinute(minutes);
    const hour = Math.floor(safe / 60) % 24;
    const minute = safe % 60;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return withSeconds ? `${hh}:${mm}:00` : `${hh}:${mm}`;
};

const isWeeklyTrigger = (trigger: unknown): trigger is WeeklyTriggerRecord => {
    const triggerRecord = asRecord(trigger);
    if (!triggerRecord) return false;
    const subtype = asString(triggerRecord.subtype);
    if (subtype === "WeeklyTrigger") return true;
    const properties = asRecord(triggerRecord.properties);
    if (!properties) return false;
    return asInteger(properties.dayOfWeek) !== undefined && asString(properties.startTime) !== undefined;
};

const getWeeklyTrigger = (rule: InteractionRule): WeeklyTriggerRecord | undefined => {
    if (!Array.isArray(rule.triggers)) return undefined;
    return rule.triggers.find((trigger) => isWeeklyTrigger(trigger)) as WeeklyTriggerRecord | undefined;
};

const getSetpointValue = (action: InteractionAction): number | undefined => {
    const params = asRecord(action.params);
    const setpoint = asRecord(params?.setpointTemperature);
    const value = asNumber(setpoint?.value);
    if (value === undefined) return undefined;
    return normalizeTemperature(value);
};

const getSetpointAction = (rule: InteractionRule): InteractionAction | undefined => {
    if (!Array.isArray(rule.actions)) return undefined;
    return rule.actions.find((action) => getSetpointValue(action) !== undefined);
};

const isHeatingRule = (rule: InteractionRule): boolean => {
    return getWeeklyTrigger(rule) !== undefined && getSetpointAction(rule) !== undefined;
};

const normalizePoints = (points: RulePoint[]): RulePoint[] => {
    const sorted = [...points]
        .map((point) => ({
            startMinutes: clampMinute(point.startMinutes),
            temperature: normalizeTemperature(point.temperature)
        }))
        .filter((point) => point.startMinutes < MINUTES_PER_DAY)
        .sort((left, right) => left.startMinutes - right.startMinutes);

    const compact: RulePoint[] = [];
    for (const point of sorted) {
        const previous = compact[compact.length - 1];
        if (!previous) {
            compact.push(point);
            continue;
        }
        if (previous.startMinutes === point.startMinutes) {
            previous.temperature = point.temperature;
            continue;
        }
        compact.push(point);
    }
    return compact;
};

const pointsToPeriods = (points: RulePoint[], baseTemperature: number, dayMask: number): HeatingPeriod[] => {
    const normalizedPoints = normalizePoints(points);
    const periods: HeatingPeriod[] = [];
    let cursor = 0;
    let currentTemperature = normalizeTemperature(baseTemperature);

    for (const point of normalizedPoints) {
        if (point.startMinutes > cursor && currentTemperature !== baseTemperature) {
            periods.push({
                id: `${dayMask}-${cursor}-${point.startMinutes}`,
                startMinutes: cursor,
                endMinutes: point.startMinutes,
                temperature: currentTemperature
            });
        }
        currentTemperature = point.temperature;
        cursor = point.startMinutes;
    }

    if (cursor < MINUTES_PER_DAY && currentTemperature !== baseTemperature) {
        periods.push({
            id: `${dayMask}-${cursor}-${MINUTES_PER_DAY}`,
            startMinutes: cursor,
            endMinutes: MINUTES_PER_DAY,
            temperature: currentTemperature
        });
    }

    return periods;
};

const periodsToPoints = (baseTemperature: number, periods: HeatingPeriod[]): RulePoint[] => {
    const points: RulePoint[] = [{
        startMinutes: 0,
        temperature: normalizeTemperature(baseTemperature)
    }];

    for (const period of normalizeHeatingPeriods(periods)) {
        points.push({
            startMinutes: period.startMinutes,
            temperature: normalizeTemperature(period.temperature)
        });
        points.push({
            startMinutes: period.endMinutes,
            temperature: normalizeTemperature(baseTemperature)
        });
    }

    return normalizePoints(points);
};

const buildRuleLookup = (interaction: Interaction): Map<string, InteractionRule> => {
    const lookup = new Map<string, InteractionRule>();
    for (const rule of interaction.rules ?? []) {
        const trigger = getWeeklyTrigger(rule);
        const action = getSetpointAction(rule);
        if (!trigger || !action) continue;

        const properties = asRecord(trigger.properties);
        const dayMask = asInteger(properties?.dayOfWeek);
        const startTime = asString(properties?.startTime);
        if (dayMask === undefined || !startTime) continue;

        const key = `${dayMask}|${startTime}|${action.target ?? ""}`;
        lookup.set(key, rule);
    }
    return lookup;
};

const buildDayMaskLabel = (dayMask: number): string => {
    const map: Record<number, string> = {
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
    return map[dayMask] ?? `Tagesmaske ${dayMask}`;
};

export const isHeatingAutomation = (interaction: Interaction): boolean => {
    if (interaction.tags?.scenarioTemplateId === "HeatingRoom") {
        return true;
    }
    return (interaction.rules ?? []).some((rule) => isHeatingRule(rule));
};

export const parseHeatingDaySchedules = (interaction: Interaction): HeatingDaySchedule[] => {
    const grouped = new Map<number, {
        points: RulePoint[],
        targetCapability?: string,
        triggerSource?: string,
        triggerNamespace?: string,
        actionNamespace?: string,
        recurrenceInterval?: number
    }>();

    for (const rule of interaction.rules ?? []) {
        const trigger = getWeeklyTrigger(rule);
        const action = getSetpointAction(rule);
        if (!trigger || !action) continue;

        const triggerProperties = asRecord(trigger.properties);
        const dayMask = asInteger(triggerProperties?.dayOfWeek) ?? DEFAULT_DAY_MASK;
        const startTime = asString(triggerProperties?.startTime);
        const temperature = getSetpointValue(action);
        if (!startTime || temperature === undefined) continue;

        const startMinutes = parseMinuteValue(startTime);
        if (startMinutes === undefined) continue;

        const entry = grouped.get(dayMask) ?? {points: []};
        entry.points.push({
            startMinutes,
            temperature
        });
        entry.targetCapability = action.target ?? entry.targetCapability;
        entry.actionNamespace = action.namespace ?? entry.actionNamespace;
        entry.triggerSource = trigger.source ?? entry.triggerSource;
        entry.triggerNamespace = trigger.namespace ?? entry.triggerNamespace;
        entry.recurrenceInterval = asInteger(triggerProperties?.recurrenceInterval) ?? entry.recurrenceInterval;
        grouped.set(dayMask, entry);
    }

    if (grouped.size === 0) {
        return [];
    }

    return Array.from(grouped.entries())
        .map(([dayMask, group]) => {
            const tagValue = interaction.tags?.[`${BASE_TEMPERATURE_TAG_PREFIX}${dayMask}`];
            const baseFromTag = asNumber(tagValue);
            const firstPoint = normalizePoints(group.points)[0];
            const baseTemperature = normalizeTemperature(baseFromTag ?? firstPoint?.temperature ?? DEFAULT_BASE_TEMPERATURE);
            return {
                dayMask,
                baseTemperature,
                periods: pointsToPeriods(group.points, baseTemperature, dayMask),
                targetCapability: group.targetCapability,
                actionNamespace: group.actionNamespace,
                triggerSource: group.triggerSource,
                triggerNamespace: group.triggerNamespace,
                recurrenceInterval: group.recurrenceInterval ?? 1
            } satisfies HeatingDaySchedule;
        })
        .sort((left, right) => left.dayMask - right.dayMask);
};

export const applyHeatingSchedulesToInteraction = (interaction: Interaction, schedules: HeatingDaySchedule[]): Interaction => {
    const existingRuleLookup = buildRuleLookup(interaction);
    const nextRules: InteractionRule[] = [];

    for (const schedule of schedules) {
        const points = periodsToPoints(schedule.baseTemperature, schedule.periods)
            .filter((point) => point.startMinutes < MINUTES_PER_DAY);

        const triggerSource = schedule.triggerSource ?? "/capability/74a80bc401bf4107b4b02c4900447f1b";
        const triggerNamespace = schedule.triggerNamespace ?? "core.RWE";
        const actionNamespace = schedule.actionNamespace ?? "core.RWE";
        const recurrenceInterval = schedule.recurrenceInterval ?? 1;

        for (const point of points) {
            const startTime = formatTime(point.startMinutes, true);
            const lookupKey = `${schedule.dayMask}|${startTime}|${schedule.targetCapability ?? ""}`;
            const existingRule = existingRuleLookup.get(lookupKey);
            const existingTrigger = existingRule ? getWeeklyTrigger(existingRule) : undefined;
            const existingAction = existingRule ? getSetpointAction(existingRule) : undefined;
            const existingTriggerProperties = asRecord(existingTrigger?.properties) ?? {};
            const existingParams = asRecord(existingAction?.params) ?? {};
            const existingSetpoint = asRecord(existingParams.setpointTemperature) ?? {};

            const triggerRecord: Record<string, unknown> = {
                ...(existingTrigger ?? {}),
                type: existingTrigger?.type ?? "Custom",
                subtype: "WeeklyTrigger",
                source: triggerSource,
                namespace: triggerNamespace,
                properties: {
                    ...existingTriggerProperties,
                    dayOfWeek: schedule.dayMask,
                    recurrenceInterval,
                    startTime
                }
            };

            const nextAction: InteractionAction = {
                ...(existingAction ?? {}),
                type: existingAction?.type ?? "SetState",
                namespace: actionNamespace,
                target: schedule.targetCapability ?? existingAction?.target,
                params: {
                    ...existingParams,
                    setpointTemperature: {
                        ...existingSetpoint,
                        type: "Constant",
                        value: normalizeTemperature(point.temperature)
                    }
                }
            };

            nextRules.push({
                id: existingRule?.id,
                conditionEvaluationDelay: existingRule?.conditionEvaluationDelay,
                constraints: existingRule?.constraints ?? [],
                tags: existingRule?.tags ?? {},
                triggers: [triggerRecord],
                actions: [nextAction]
            });
        }
    }

    const nextTags = {...(interaction.tags ?? {})};
    for (const key of Object.keys(nextTags)) {
        if (key.startsWith(BASE_TEMPERATURE_TAG_PREFIX)) {
            delete nextTags[key];
        }
    }
    for (const schedule of schedules) {
        nextTags[`${BASE_TEMPERATURE_TAG_PREFIX}${schedule.dayMask}`] = String(normalizeTemperature(schedule.baseTemperature));
    }

    return {
        ...interaction,
        rules: nextRules,
        tags: nextTags
    };
};

export const normalizeHeatingPeriods = (periods: HeatingPeriod[]): HeatingPeriod[] => {
    return periods
        .map((period) => ({
            ...period,
            startMinutes: clampMinute(period.startMinutes),
            endMinutes: clampMinute(period.endMinutes),
            temperature: normalizeTemperature(period.temperature)
        }))
        .filter((period) => period.endMinutes > period.startMinutes)
        .sort((left, right) => {
            if (left.startMinutes !== right.startMinutes) {
                return left.startMinutes - right.startMinutes;
            }
            return left.endMinutes - right.endMinutes;
        });
};

export const validateHeatingPeriods = (periods: HeatingPeriod[]): string | undefined => {
    const normalized = normalizeHeatingPeriods(periods);
    for (let index = 0; index < normalized.length; index++) {
        const period = normalized[index];
        if (period.startMinutes < 0 || period.endMinutes > MINUTES_PER_DAY || period.startMinutes >= period.endMinutes) {
            return `Ungueltiger Zeitraum ${index + 1}.`;
        }
    }

    for (let index = 1; index < normalized.length; index++) {
        const previous = normalized[index - 1];
        const current = normalized[index];
        if (current.startMinutes < previous.endMinutes) {
            return `Ueberlappung zwischen Zeitraum ${index} und ${index + 1}.`;
        }
    }

    return undefined;
};

export const validateHeatingSchedules = (schedules: HeatingDaySchedule[]): string | undefined => {
    for (const schedule of schedules) {
        const validation = validateHeatingPeriods(schedule.periods);
        if (validation) {
            return `${buildDayMaskLabel(schedule.dayMask)}: ${validation}`;
        }
    }
    return undefined;
};

export const buildHeatingTimelineSegments = (baseTemperature: number, periods: HeatingPeriod[]): HeatingTimelineSegment[] => {
    const normalizedPeriods = normalizeHeatingPeriods(periods);
    const segments: HeatingTimelineSegment[] = [];
    let cursor = 0;

    for (const period of normalizedPeriods) {
        if (period.startMinutes > cursor) {
            segments.push({
                startMinutes: cursor,
                endMinutes: period.startMinutes,
                temperature: normalizeTemperature(baseTemperature)
            });
        }
        segments.push({
            startMinutes: period.startMinutes,
            endMinutes: period.endMinutes,
            temperature: normalizeTemperature(period.temperature)
        });
        cursor = period.endMinutes;
    }

    if (cursor < MINUTES_PER_DAY) {
        segments.push({
            startMinutes: cursor,
            endMinutes: MINUTES_PER_DAY,
            temperature: normalizeTemperature(baseTemperature)
        });
    }

    return segments;
};

export const getHeatingDayLabel = (dayMask: number): string => buildDayMaskLabel(dayMask);

export const minutesToTimeInput = (minutes: number): string => formatTime(minutes, false);

export const minutesToTimeWithSeconds = (minutes: number): string => formatTime(minutes, true);

export const timeInputToMinutes = (value: string): number | undefined => parseMinuteValue(value);

