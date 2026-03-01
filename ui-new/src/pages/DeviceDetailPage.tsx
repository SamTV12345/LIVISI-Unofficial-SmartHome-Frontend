import {Suspense, useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX, HEATING} from "@/src/constants/FieldConstants.ts";
import {useContentModel} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import {Interaction} from "@/src/models/Interaction.ts";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {cn} from "@/src/utils/cn-helper.ts";
import {
    ChevronRight,
    CircleAlert,
    Clock3,
    Cpu,
    Droplets,
    Gauge,
    Info,
    Layers,
    LineChart,
    Link2,
    MapPin,
    Package,
    Power,
    RefreshCw,
    SlidersHorizontal,
    Sparkles,
    Thermometer,
    Wifi
} from "lucide-react";
import TimeSeriesChart, {DataPoint} from "@/src/components/layout/TimeSeriesChart.tsx";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {postJson} from "@/src/api/httpClient.ts";
import {useTranslation} from "react-i18next";
import {i18next} from "@/src/language/i18n.ts";

type DeviceStateRow = {
    capabilityId: string,
    capabilityName: string,
    stateKey: string,
    value: unknown,
    lastChanged?: string
}

type CapabilityHistoryRow = {
    eventType: string,
    eventTime: string,
    dataName: string,
    dataValue: string,
    entityId: string
}

type HistoryWindow = {
    start: string,
    end: string
}

const createHistoryWindow = (): HistoryWindow => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
};

const DEFAULT_CLIMATE_RECOMMENDATIONS = [
    "ui_new.device_detail.default_recommendation_1",
    "ui_new.device_detail.default_recommendation_2"
];

const STATE_LABELS: Record<string, string> = {
    onState: "ui_new.device_detail.state.on_state",
    isOpen: "ui_new.device_detail.state.contact",
    isSmokeAlarm: "ui_new.device_detail.state.smoke_alarm",
    temperature: "ui_new.device_detail.state.temperature",
    humidity: "ui_new.device_detail.state.humidity",
    setpointTemperature: "ui_new.device_detail.state.setpoint_temperature",
    isReachable: "ui_new.device_detail.state.reachability",
    batteryStatus: "ui_new.device_detail.state.battery"
};

const BOOL_LABELS: Record<string, { on: string, off: string }> = {
    onState: {on: "ui_new.common.on", off: "ui_new.common.off"},
    isOpen: {on: "ui_new.device_detail.bool.open", off: "ui_new.device_detail.bool.closed"},
    isSmokeAlarm: {on: "ui_new.device_detail.bool.alarm", off: "ui_new.device_detail.bool.no_alarm"},
    isReachable: {on: "ui_new.device_detail.bool.online", off: "ui_new.device_detail.bool.offline"}
};

const formatStateValue = (key: string, value: unknown): string => {
    if (typeof value === "boolean") {
        const labels = BOOL_LABELS[key];
        return labels ? (value ? i18next.t(labels.on) : i18next.t(labels.off)) : (value ? i18next.t("ui_new.common.on") : i18next.t("ui_new.common.off"));
    }
    if (typeof value === "number") {
        if (key.toLowerCase().includes("temperature")) return `${value.toFixed(1)} °C`;
        if (key.toLowerCase().includes("humidity")) return `${Math.round(value)} %`;
        return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    if (value === undefined || value === null || value === "") return "-";
    return String(value);
};

const stateBadgeClass = (key: string, value: unknown): string => {
    if (typeof value === "boolean") {
        if (key === "isSmokeAlarm") return value ? "border-red-200 bg-red-100 text-red-700" : "border-emerald-200 bg-emerald-100 text-emerald-700";
        if (key === "isOpen") return value ? "border-amber-200 bg-amber-100 text-amber-700" : "border-emerald-200 bg-emerald-100 text-emerald-700";
        if (key === "isReachable") return value ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-red-200 bg-red-100 text-red-700";
        return value ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700";
    }
    if (typeof value === "number" && key.toLowerCase().includes("temperature")) return "border-cyan-200 bg-cyan-100 text-cyan-800";
    if (typeof value === "number" && key.toLowerCase().includes("humidity")) return "border-blue-200 bg-blue-100 text-blue-800";
    return "border-slate-200 bg-slate-100 text-slate-700";
};

const parseStateRows = (device: Device): DeviceStateRow[] => {
    const capabilityNameMap = new Map((device.capabilityData ?? []).map((capability) => [capability.id, capability.config?.name ?? capability.id]));
    const rows: DeviceStateRow[] = [];
    for (const capabilityState of device.capabilityState ?? []) {
        const capabilityName = capabilityNameMap.get(capabilityState.id) ?? capabilityState.id;
        for (const [stateKey, rawStateValue] of Object.entries(capabilityState.state ?? {})) {
            const typedState = rawStateValue as { value?: unknown, lastChanged?: string };
            rows.push({
                capabilityId: capabilityState.id,
                capabilityName,
                stateKey,
                value: typedState.value,
                lastChanged: typedState.lastChanged
            });
        }
    }
    return rows.sort((a, b) => (b.lastChanged ?? "").localeCompare(a.lastChanged ?? ""));
};

const isScenarioRelatedToDevice = (interaction: Interaction, device: Device): boolean => {
    const capabilityIds = new Set((device.capabilityState ?? []).map((capability) => capability.id));
    return interaction.rules?.some((rule) => (rule.actions ?? []).some((action) => {
        const target = action.target ?? "";
        const taggedDevice = action.tags?.deviceBySelected ?? "";
        if (target.includes(`/device/${device.id}`) || taggedDevice === device.id || taggedDevice.includes(`/device/${device.id}`)) return true;
        for (const capabilityId of capabilityIds) {
            if (target.includes(`/capability/${capabilityId}`)) return true;
        }
        return false;
    })) ?? false;
};

const readNumberState = (device: Device, key: string): number | undefined => {
    for (const capability of device.capabilityState ?? []) {
        const value = capability.state?.[key]?.value;
        if (typeof value === "number") return value;
    }
    return undefined;
};

const readUnderlyingDeviceIds = (device: Device): string[] => {
    const rawIds = device.config?.underlyingDeviceIds as unknown;
    if (!rawIds) return [];
    if (Array.isArray(rawIds)) return rawIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    if (typeof rawIds === "string") return rawIds.split(",").map((id) => id.trim()).filter(Boolean);
    return [];
};

const toDataPoints = (rows: CapabilityHistoryRow[]): DataPoint[] => {
    return rows
        .map((row) => ({
            timeString: row.eventTime,
            value: Number.parseFloat(row.dataValue)
        }))
        .filter((row) => Number.isFinite(row.value));
};

const climateScenarioScore = (interaction: Interaction): number => {
    const name = (interaction.name ?? "").toLowerCase();
    const keywords = ["energie", "ferien", "urlaub", "zuhause", "abwes", "heiz", "klima", "temperatur", "frost"];
    return keywords.reduce((score, keyword) => score + (name.includes(keyword) ? 1 : 0), 0);
};

const ClimateHistorySection = ({device, timeWindow, onRefresh}: {device: Device, timeWindow: HistoryWindow, onRefresh: () => void}) => {
    const {t} = useTranslation();
    const temperatureParams = useMemo(() => ({
        params: {
            query: {
                entityId: `${device.manufacturer}.${device.type}.${device.serialNumber}.RoomTemperature`,
                start: timeWindow.start,
                end: timeWindow.end,
                page: 1,
                pagesize: 288,
                eventType: "StateChanged"
            }
        }
    }), [device.manufacturer, device.serialNumber, device.type, timeWindow.end, timeWindow.start]);

    const humidityParams = useMemo(() => ({
        params: {
            query: {
                entityId: `${device.manufacturer}.${device.type}.${device.serialNumber}.RoomHumidity`,
                start: timeWindow.start,
                end: timeWindow.end,
                page: 1,
                pagesize: 288,
                eventType: "StateChanged"
            }
        }
    }), [device.manufacturer, device.serialNumber, device.type, timeWindow.end, timeWindow.start]);

    const {data: temperatureResponse} = apiQueryClient.useSuspenseQuery("get", "/data/capability", temperatureParams);
    const {data: humidityResponse} = apiQueryClient.useSuspenseQuery("get", "/data/capability", humidityParams);

    const roomTemperatureHistory = useMemo(() => toDataPoints((temperatureResponse as CapabilityHistoryRow[] | undefined) ?? []), [temperatureResponse]);
    const roomHumidityHistory = useMemo(() => toDataPoints((humidityResponse as CapabilityHistoryRow[] | undefined) ?? []), [humidityResponse]);

    return (
        <>
            <div className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                    <RefreshCw size={12}/>
                    {t("ui_new.device_detail.reload_history")}
                </button>
            </div>
            {roomTemperatureHistory.length === 0 && roomHumidityHistory.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    {t("ui_new.device_detail.no_history_data")}
                </div>
            )}
            {roomTemperatureHistory.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-2">
                    <TimeSeriesChart data={roomTemperatureHistory} chartTitle={t("ui_new.device_detail.room_temperature_24h")} ytitle={t("ui_new.device_detail.temperature_celsius")}/>
                </div>
            )}
            {roomHumidityHistory.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-2">
                    <TimeSeriesChart data={roomHumidityHistory} chartTitle={t("ui_new.device_detail.room_humidity_24h")} ytitle={t("ui_new.device_detail.humidity_percent")}/>
                </div>
            )}
        </>
    );
};

export const DeviceDetailPage = () => {
    const {t} = useTranslation();
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const allThings = useContentModel((state) => state.allThings);
    const socketConnected = useContentModel((state) => state.socketConnected);
    const device = useMemo(() => params.id ? allThings?.devices?.[params.id] : undefined, [allThings?.devices, params.id]);
    const [climateHistoryWindow, setClimateHistoryWindow] = useState<HistoryWindow>(() => createHistoryWindow());

    useEffect(() => {
        setClimateHistoryWindow(createHistoryWindow());
    }, [device?.id]);

    const stateRows = useMemo(() => device ? parseStateRows(device) : [], [device]);
    const stateGroups = useMemo(() => {
        const map = new Map<string, { name: string, rows: DeviceStateRow[] }>();
        for (const row of stateRows) {
            const group = map.get(row.capabilityId) ?? {name: row.capabilityName, rows: []};
            group.rows.push(row);
            map.set(row.capabilityId, group);
        }
        return Array.from(map.entries()).map(([id, group]) => ({id, ...group}));
    }, [stateRows]);
    const latestStateChange = stateRows[0]?.lastChanged;

    const onStateCapability = useMemo(() => (device?.capabilityState ?? []).find((capability) => typeof capability.state?.onState?.value === "boolean"), [device?.capabilityState]);
    const onStateFromStore = onStateCapability ? Boolean(onStateCapability.state?.onState?.value) : undefined;
    const [onStateValue, setOnStateValue] = useState<boolean | undefined>(onStateFromStore);
    const [switchPending, setSwitchPending] = useState(false);
    const [switchError, setSwitchError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!switchPending) setOnStateValue(onStateFromStore);
    }, [onStateFromStore, switchPending]);

    const setpointCapability = useMemo(() => (device?.capabilityState ?? []).find((capability) => typeof capability.state?.setpointTemperature?.value === "number"), [device?.capabilityState]);
    const setpointFromStore = useMemo(() => {
        const value = setpointCapability?.state?.setpointTemperature?.value;
        return typeof value === "number" ? value : undefined;
    }, [setpointCapability]);
    const [setpointValue, setSetpointValue] = useState<number | undefined>(setpointFromStore);
    const [setpointPending, setSetpointPending] = useState(false);
    const [setpointError, setSetpointError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!setpointPending) setSetpointValue(setpointFromStore);
    }, [setpointFromStore, setpointPending]);

    useEffect(() => {
        if (!device || !setpointCapability || setpointValue === undefined || setpointFromStore === undefined || setpointValue === setpointFromStore) return;
        const timeout = setTimeout(() => {
            setSetpointPending(true);
            setSetpointError(undefined);
            postJson(ACTION_ENDPOINT, {
                id: setpointCapability.id,
                target: CAPABILITY_PREFIX + setpointCapability.id,
                type: "SetState",
                namespace: "core." + device.manufacturer,
                params: {setpointTemperature: {type: "Constant", value: Number(setpointValue)}}
            }).catch(() => {
                setSetpointError(t("ui_new.heating_device.setpoint_save_failed"));
            }).finally(() => {
                setSetpointPending(false);
            });
        }, 700);
        return () => clearTimeout(timeout);
    }, [device, setpointCapability, setpointFromStore, setpointValue]);

    const toggleOnState = useCallback(async () => {
        if (!device || !onStateCapability || onStateValue === undefined || switchPending) return;
        const previousValue = onStateValue;
        const nextValue = !previousValue;
        setOnStateValue(nextValue);
        setSwitchPending(true);
        setSwitchError(undefined);
        try {
            await postJson(ACTION_ENDPOINT, {
                id: onStateCapability.id,
                target: CAPABILITY_PREFIX + onStateCapability.id,
                namespace: device.product,
                type: "SetState",
                params: {onState: {type: "Constant", value: nextValue}}
            });
        } catch {
            setSwitchError(t("ui_new.device_detail.device_state_change_failed"));
            setOnStateValue(previousValue);
        } finally {
            setSwitchPending(false);
        }
    }, [device, onStateCapability, onStateValue, switchPending, t]);

    const relatedScenarios = useMemo(() => device ? (allThings?.interactions ?? []).filter((interaction) => isScenarioRelatedToDevice(interaction, device)) : [], [allThings?.interactions, device]);
    const recommendedScenarios = useMemo(() => {
        return [...relatedScenarios]
            .sort((a, b) => {
                const scoreDiff = climateScenarioScore(b) - climateScenarioScore(a);
                if (scoreDiff !== 0) return scoreDiff;
                return (b.modified ?? "").localeCompare(a.modified ?? "");
            })
            .slice(0, 5);
    }, [relatedScenarios]);
    const linkedDeviceIds = useMemo(() => device ? readUnderlyingDeviceIds(device) : [], [device]);
    const linkedDevices = useMemo(() => linkedDeviceIds.map((id) => ({id, linkedDevice: allThings?.devices?.[id]})), [allThings?.devices, linkedDeviceIds]);
    const currentTemperature = useMemo(() => device ? readNumberState(device, "temperature") : undefined, [device]);
    const currentHumidity = useMemo(() => device ? readNumberState(device, "humidity") : undefined, [device]);
    const isRoomClimate = device?.type === HEATING;

    if (!allThings) return <PageComponent title={t("ui_new.device_detail.device")} to="/devices"><div className="p-4 md:p-6 text-gray-500">{t("ui_new.device_detail.loading_data")}</div></PageComponent>;
    if (!device) return <PageComponent title={t("ui_new.device_detail.device")} to="/devices"><div className="p-4 md:p-6 text-gray-500">{t("ui_new.device_detail.not_found")}</div></PageComponent>;

    if (isRoomClimate) {
        return (
            <PageComponent title={device.config.name} to="/devices">
                <div className="space-y-5 p-4 md:p-6">
                    <div className="relative overflow-hidden rounded-2xl border border-cyan-900/20 bg-gradient-to-br from-[#12518b] via-[#1d6c88] to-[#2f8a6b] p-5 text-white md:p-6">
                        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"/>
                        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start">
                            <div className="space-y-3">
                                <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{device.config.name}</h2>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1">
                                        <MapPin size={14}/>
                                        {device.locationData?.config?.name ?? t("ui_new.device_detail.no_room")}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1">
                                        <Thermometer size={14}/>
                                        {t("ui_new.device_detail.room_temperature")}: {typeof currentTemperature === "number" ? `${currentTemperature.toFixed(1)} °C` : "-"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1">
                                        <Droplets size={14}/>
                                        {t("ui_new.device_detail.humidity")}: {typeof currentHumidity === "number" ? `${Math.round(currentHumidity)} %` : "-"}
                                    </span>
                                </div>
                            </div>
                            <div className="md:ml-auto flex flex-col gap-3 md:items-end">
                                <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm", socketConnected ? "border-emerald-200/40 bg-emerald-200/20" : "border-amber-200/40 bg-amber-200/20")}>
                                    <Wifi size={14}/>
                                    {socketConnected ? t("ui_new.common.realtime_connected") : t("ui_new.common.realtime_disconnected")}
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">{t("ui_new.device_detail.target_temperature")}</div>
                                <div className="mt-1 text-sm font-semibold">{setpointValue !== undefined ? `${setpointValue.toFixed(1)} °C` : "-"}</div>
                            </div>
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">{t("ui_new.device_detail.analytics")}</div>
                                <div className="mt-1 text-sm font-semibold">{t("ui_new.device_detail.history_24h")}</div>
                            </div>
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">{t("ui_new.nav.automation")}</div>
                                <div className="mt-1 text-sm font-semibold">{relatedScenarios.length}</div>
                            </div>
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">{t("ui_new.device_detail.last_event")}</div>
                                <div className="mt-1 text-sm font-semibold">{latestStateChange ? formatTime(latestStateChange) : "-"}</div>
                            </div>
                        </div>
                    </div>

                    <Card className="border-gray-200 shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t("ui_new.device_detail.target_temperature")}</CardTitle>
                            <CardDescription>{t("ui_new.device_detail.auto_save_changes")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {setpointCapability && setpointValue !== undefined && (
                                <>
                                    <div className="flex items-end justify-between">
                                        <div className="inline-flex items-center gap-2 text-3xl font-semibold text-slate-900">
                                            <Gauge size={24}/>
                                            {setpointValue.toFixed(1)} °C
                                        </div>
                                        <div className="text-xs text-slate-500">{setpointPending ? t("ui_new.common.saving") : t("ui_new.common.live")}</div>
                                    </div>
                                    <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                                        <SliderCDN
                                            min={6.5}
                                            max={30}
                                            step={0.5}
                                            variant="climate"
                                            value={[setpointValue]}
                                            onValueChange={(values) => {
                                                setSetpointValue(values[0]);
                                            }}
                                        />
                                    </div>
                                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                                        <span>6.5 °C</span>
                                        <span>30.0 °C</span>
                                    </div>
                                </>
                            )}
                            {(!setpointCapability || setpointValue === undefined) && (
                                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                    {t("ui_new.device_detail.no_setpoint_control")}
                                </div>
                            )}
                            {setpointError && <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{setpointError}</div>}
                        </CardContent>
                    </Card>

                    <Accordion type="multiple" defaultValue={["analysis", "recommended", "linked", "info"]} className="space-y-3">
                        <AccordionItem value="analysis" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center gap-2 pr-2">
                                    <LineChart size={18}/>
                                    <span className="font-semibold text-gray-900">{t("ui_new.device_detail.analytics")}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 px-4 pb-4">
                                <Suspense fallback={<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">{t("ui_new.device_detail.loading_history")}</div>}>
                                    <ClimateHistorySection
                                        device={device}
                                        timeWindow={climateHistoryWindow}
                                        onRefresh={() => {
                                            setClimateHistoryWindow(createHistoryWindow());
                                        }}
                                    />
                                </Suspense>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="recommended" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center gap-2 pr-2">
                                    <Layers size={18}/>
                                    <span className="font-semibold text-gray-900">{t("ui_new.device_detail.recommended_automations")}</span>
                                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                        {recommendedScenarios.length > 0 ? recommendedScenarios.length : DEFAULT_CLIMATE_RECOMMENDATIONS.length}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 px-4 pb-4">
                                {recommendedScenarios.length > 0 && recommendedScenarios.map((scenario) => (
                                    <button
                                        type="button"
                                        key={scenario.id}
                                        onClick={() => {
                                            navigate(`/automation/${scenario.id}`);
                                        }}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-slate-900">{scenario.name ?? scenario.id}</div>
                                            <ChevronRight size={16} className="ml-auto text-slate-400"/>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">{t("ui_new.automation.updated_label", {time: formatTime(scenario.modified)})}</div>
                                    </button>
                                ))}
                                {recommendedScenarios.length === 0 && DEFAULT_CLIMATE_RECOMMENDATIONS.map((suggestion) => (
                                    <div key={suggestion} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-700">
                                        {t(suggestion)}
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="linked" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center gap-2 pr-2">
                                    <Link2 size={18}/>
                                    <span className="font-semibold text-gray-900">{t("ui_new.device_detail.linked_devices")}</span>
                                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{linkedDeviceIds.length}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 px-4 pb-4">
                                {linkedDevices.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        {t("ui_new.device_detail.no_linked_devices")}
                                    </div>
                                )}
                                {linkedDevices.map(({id, linkedDevice}) => (
                                    <div key={id} className="rounded-lg border border-gray-200 px-3 py-2">
                                        <div className="font-semibold text-slate-900">{linkedDevice?.config?.name ?? id}</div>
                                        <div className="mt-1 text-xs text-slate-500">{linkedDevice ? `${linkedDevice.type} • ${linkedDevice.serialNumber}` : t("ui_new.device_detail.device_not_loaded")}</div>
                                        {linkedDevice && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigate(`/devices/${linkedDevice.id}`);
                                                }}
                                                className="mt-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                {t("ui_new.automation.details")}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="info" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center gap-2 pr-2">
                                    <Info size={18}/>
                                    <span className="font-semibold text-gray-900">{t("ui_new.device_detail.device_info")}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {[
                                        {label: "ID", value: device.id},
                                        {label: "Seriennummer", value: device.serialNumber},
                                        {label: "Version", value: device.version},
                                        {label: "Protokoll", value: device.config.protocolId},
                                        {label: "Produkt", value: device.product},
                                        {label: "Entdeckt", value: device.config.timeOfDiscovery ? formatTime(device.config.timeOfDiscovery) : "-"},
                                        {label: t("ui_new.device_detail.activated"), value: device.config.timeOfAcceptance ? formatTime(device.config.timeOfAcceptance) : "-"},
                                        {label: t("ui_new.device_detail.room"), value: device.locationData?.config?.name ?? "-"}
                                    ].map((row) => (
                                        <div key={row.label} className="rounded-lg border border-gray-200 p-3">
                                            <div className="text-xs uppercase tracking-wide text-gray-500">{row.label}</div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">{row.value || "-"}</div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </PageComponent>
        );
    }

    return (
        <PageComponent title={device.config.name} to="/devices">
            <div className="space-y-5 p-4 md:p-6">
                <div className="relative overflow-hidden rounded-2xl border border-cyan-900/20 bg-gradient-to-br from-[#12518b] via-[#1d6c88] to-[#2f8a6b] p-5 text-white md:p-6">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"/>
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{device.config.name}</h2>
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"><MapPin size={14}/>{device.locationData?.config?.name ?? t("ui_new.device_detail.no_room")}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"><Cpu size={14}/>{device.manufacturer}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"><Package size={14}/>{device.config.modelId}</span>
                            </div>
                        </div>
                        <div className="md:ml-auto flex flex-col gap-3 md:items-end">
                            <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm", socketConnected ? "border-emerald-200/40 bg-emerald-200/20" : "border-amber-200/40 bg-amber-200/20")}><Wifi size={14}/>{socketConnected ? t("ui_new.common.realtime_connected") : t("ui_new.common.realtime_disconnected")}</span>
                            {onStateCapability && <button type="button" onClick={() => { void toggleOnState(); }} disabled={switchPending} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", onStateValue ? "border-emerald-200/40 bg-emerald-300/20" : "border-white/40 bg-black/20", switchPending && "cursor-not-allowed opacity-70")}><Power size={16}/>{switchPending ? t("ui_new.common.saving") : onStateValue ? t("ui_new.common.on") : t("ui_new.common.off")}</button>}
                        </div>
                    </div>
                    <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">{t("ui_new.common.status")}</div><div className="mt-1 text-sm font-semibold">{onStateValue === undefined ? t("ui_new.device_detail.no_switch_capability") : onStateValue ? t("ui_new.common.active") : t("ui_new.common.inactive")}</div></div>
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">{t("ui_new.nav.automation")}</div><div className="mt-1 text-sm font-semibold">{relatedScenarios.length}</div></div>
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">{t("ui_new.device_detail.live_values")}</div><div className="mt-1 text-sm font-semibold">{stateRows.length}</div></div>
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">{t("ui_new.device_detail.last_change")}</div><div className="mt-1 text-sm font-semibold">{latestStateChange ? formatTime(latestStateChange) : "-"}</div></div>
                    </div>
                </div>

                {(switchError || setpointError) && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{switchError ?? setpointError}</div>}

                <Accordion type="multiple" defaultValue={["controls", "states"]} className="space-y-3">
                    <AccordionItem value="controls" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><SlidersHorizontal size={18}/><span className="font-semibold text-gray-900">{t("ui_new.device_detail.controls")}</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-3">
                            {!onStateCapability && (!setpointCapability || setpointValue === undefined) && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">{t("ui_new.device_detail.no_direct_controls")}</div>}
                            {onStateCapability && <Card className="border-gray-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">{t("ui_new.device_detail.switch")}</CardTitle><CardDescription>{t("ui_new.device_detail.direct_on_off_control")}</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-3"><div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{t("ui_new.device_detail.current_state")}: <span className="font-semibold text-slate-900">{onStateValue ? t("ui_new.common.on") : t("ui_new.common.off")}</span></div><button type="button" onClick={() => { void toggleOnState(); }} disabled={switchPending} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", onStateValue ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700", switchPending && "cursor-not-allowed opacity-70")}>{switchPending ? t("ui_new.common.saving") : onStateValue ? t("ui_new.device_detail.turn_off") : t("ui_new.device_detail.turn_on")}</button></CardContent></Card>}
                            {setpointCapability && setpointValue !== undefined && <Card className="border-gray-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">{t("ui_new.device_detail.setpoint_temperature")}</CardTitle><CardDescription>{t("ui_new.device_detail.auto_save_short_delay")}</CardDescription></CardHeader><CardContent><div className="flex items-end justify-between"><div className="inline-flex items-center gap-2 text-3xl font-semibold text-slate-900"><Thermometer size={24}/>{setpointValue.toFixed(1)} °C</div><div className="text-xs text-slate-500">{setpointPending ? t("ui_new.common.saving") : t("ui_new.common.live")}</div></div><div className="mt-4"><SliderCDN min={6.5} max={30} step={0.5} variant="climate" value={[setpointValue]} onValueChange={(values) => { setSetpointValue(values[0]); }}/></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>6.5 °C</span><span>30.0 °C</span></div></CardContent></Card>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="states" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><Sparkles size={18}/><span className="font-semibold text-gray-900">{t("ui_new.states.hero_title")}</span><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{stateRows.length}</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            {stateGroups.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">{t("ui_new.device_detail.no_state_data")}</div>}
                            {stateGroups.length > 0 && <div className="space-y-3">{stateGroups.map((group) => <Card key={group.id} className="border-gray-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">{group.name}</CardTitle><CardDescription>{t("ui_new.device_detail.values_count", {count: group.rows.length})}</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{group.rows.map((row) => <div key={`${row.capabilityId}-${row.stateKey}`} className="rounded-lg border border-gray-200 p-3"><div className="text-xs uppercase tracking-wide text-gray-500">{t(STATE_LABELS[row.stateKey] ?? row.stateKey)}</div><div className={cn("mt-2 inline-flex rounded-full border px-2 py-1 text-sm font-semibold", stateBadgeClass(row.stateKey, row.value))}>{formatStateValue(row.stateKey, row.value)}</div><div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500"><Clock3 size={12}/>{row.lastChanged ? formatTime(row.lastChanged) : "-"}</div></div>)}</CardContent></Card>)}</div>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="scenarios" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><Layers size={18}/><span className="font-semibold text-gray-900">{t("ui_new.nav.automation")}</span><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{relatedScenarios.length}</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            {relatedScenarios.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">{t("ui_new.device_detail.no_matching_automations")}</div>}
                            {relatedScenarios.length > 0 && <div className="space-y-2">{relatedScenarios.map((scenario) => <button type="button" key={scenario.id} onClick={() => { navigate(`/automation/${scenario.id}`); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:bg-slate-50"><div className="flex items-center gap-2"><div className="font-semibold text-slate-900">{scenario.name ?? scenario.id}</div><ChevronRight size={16} className="ml-auto text-slate-400"/></div><div className="mt-1 text-xs text-slate-500">{t("ui_new.automation.updated_label", {time: formatTime(scenario.modified)})}: {}</div></button>)}</div>}
                            <button type="button" onClick={() => { navigate("/automation"); }} className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t("ui_new.device_detail.open_all_automations")}</button>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="info" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><Info size={18}/><span className="font-semibold text-gray-900">{t("ui_new.device_detail.device_info")}</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[{label: "ID", value: device.id}, {label: t("ui_new.device_detail.serial_number"), value: device.serialNumber}, {label: t("ui_new.common.version"), value: device.version}, {label: t("ui_new.device_detail.protocol"), value: device.config.protocolId}, {label: t("ui_new.device_detail.product"), value: device.product}, {label: t("ui_new.device_detail.discovered"), value: formatTime(device.config.timeOfDiscovery)}, {label: t("ui_new.device_detail.activated"), value: formatTime(device.config.timeOfAcceptance)}, {label: t("ui_new.device_detail.room"), value: device.locationData?.config?.name ?? "-"}].map((row) => <div key={row.label} className="rounded-lg border border-gray-200 p-3"><div className="text-xs uppercase tracking-wide text-gray-500">{row.label}</div><div className="mt-1 text-sm font-semibold text-slate-900">{row.value || "-"}</div></div>)}
                            </div>
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><div className="inline-flex items-center gap-2"><CircleAlert size={14}/>{t("ui_new.device_detail.realtime_hint")}</div></div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </PageComponent>
    );
};
