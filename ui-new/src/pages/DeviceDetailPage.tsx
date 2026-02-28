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

const DEFAULT_CLIMATE_RECOMMENDATIONS = [
    "Energie sparen und Ferien machen",
    "Energie sparen, wenn niemand zuhause ist"
];

const STATE_LABELS: Record<string, string> = {
    onState: "Schalter",
    isOpen: "Kontakt",
    isSmokeAlarm: "Rauchalarm",
    temperature: "Temperatur",
    humidity: "Luftfeuchtigkeit",
    setpointTemperature: "Solltemperatur",
    isReachable: "Erreichbarkeit",
    batteryStatus: "Batterie"
};

const BOOL_LABELS: Record<string, { on: string, off: string }> = {
    onState: {on: "An", off: "Aus"},
    isOpen: {on: "Offen", off: "Geschlossen"},
    isSmokeAlarm: {on: "Alarm", off: "Kein Alarm"},
    isReachable: {on: "Online", off: "Offline"}
};

const formatStateValue = (key: string, value: unknown): string => {
    if (typeof value === "boolean") {
        const labels = BOOL_LABELS[key];
        return labels ? (value ? labels.on : labels.off) : (value ? "An" : "Aus");
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

const ClimateHistorySection = ({device}: {device: Device}) => {
    const [refreshSeed, setRefreshSeed] = useState(0);

    const timeWindow = useMemo(() => {
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }, [device.id, refreshSeed]);

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
                    onClick={() => setRefreshSeed((previous) => previous + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                    <RefreshCw size={12}/>
                    Verlauf neu laden
                </button>
            </div>
            {roomTemperatureHistory.length === 0 && roomHumidityHistory.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    Keine Verlaufsdaten vorhanden.
                </div>
            )}
            {roomTemperatureHistory.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-2">
                    <TimeSeriesChart data={roomTemperatureHistory} chartTitle="Raumtemperatur (24h)" ytitle="Temperatur in °C"/>
                </div>
            )}
            {roomHumidityHistory.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-2">
                    <TimeSeriesChart data={roomHumidityHistory} chartTitle="Luftfeuchtigkeit (24h)" ytitle="Luftfeuchtigkeit in %"/>
                </div>
            )}
        </>
    );
};

export const DeviceDetailPage = () => {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const allThings = useContentModel((state) => state.allThings);
    const socketConnected = useContentModel((state) => state.socketConnected);
    const device = useMemo(() => params.id ? allThings?.devices?.[params.id] : undefined, [allThings?.devices, params.id]);

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
                target: CAPABILITY_PREFIX + setpointCapability.id,
                type: "SetState",
                namespace: "core." + device.manufacturer,
                params: {setpointTemperature: {type: "Constant", value: Number(setpointValue)}}
            }).catch(() => {
                setSetpointError("Solltemperatur konnte nicht gespeichert werden.");
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
            setSwitchError("Gerätezustand konnte nicht geändert werden.");
            setOnStateValue(previousValue);
        } finally {
            setSwitchPending(false);
        }
    }, [device, onStateCapability, onStateValue, switchPending]);

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

    if (!allThings) return <PageComponent title="Gerät" to="/devices"><div className="p-4 md:p-6 text-gray-500">Lade Gerätedaten...</div></PageComponent>;
    if (!device) return <PageComponent title="Gerät" to="/devices"><div className="p-4 md:p-6 text-gray-500">Gerät nicht gefunden.</div></PageComponent>;

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
                                        {device.locationData?.config?.name ?? "Ohne Raum"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1">
                                        <Thermometer size={14}/>
                                        Raumtemperatur: {typeof currentTemperature === "number" ? `${currentTemperature.toFixed(1)} °C` : "-"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1">
                                        <Droplets size={14}/>
                                        Luftfeuchtigkeit: {typeof currentHumidity === "number" ? `${Math.round(currentHumidity)} %` : "-"}
                                    </span>
                                </div>
                            </div>
                            <div className="md:ml-auto flex flex-col gap-3 md:items-end">
                                <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm", socketConnected ? "border-emerald-200/40 bg-emerald-200/20" : "border-amber-200/40 bg-amber-200/20")}>
                                    <Wifi size={14}/>
                                    {socketConnected ? "Realtime verbunden" : "Realtime getrennt"}
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">Zieltemperatur</div>
                                <div className="mt-1 text-sm font-semibold">{setpointValue !== undefined ? `${setpointValue.toFixed(1)} °C` : "-"}</div>
                            </div>
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">Auswertungen</div>
                                <div className="mt-1 text-sm font-semibold">24h Verlauf</div>
                            </div>
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">Szenarien</div>
                                <div className="mt-1 text-sm font-semibold">{relatedScenarios.length}</div>
                            </div>
                            <div className="rounded-lg bg-black/15 p-3">
                                <div className="text-xs uppercase tracking-wide text-white/70">Letztes Event</div>
                                <div className="mt-1 text-sm font-semibold">{latestStateChange ? formatTime(latestStateChange) : "-"}</div>
                            </div>
                        </div>
                    </div>

                    <Card className="border-gray-200 shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Zieltemperatur</CardTitle>
                            <CardDescription>Änderungen werden automatisch gespeichert.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {setpointCapability && setpointValue !== undefined && (
                                <>
                                    <div className="flex items-end justify-between">
                                        <div className="inline-flex items-center gap-2 text-3xl font-semibold text-slate-900">
                                            <Gauge size={24}/>
                                            {setpointValue.toFixed(1)} °C
                                        </div>
                                        <div className="text-xs text-slate-500">{setpointPending ? "Speichere..." : "Live"}</div>
                                    </div>
                                    <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                                        <SliderCDN
                                            min={6.5}
                                            max={30}
                                            step={0.5}
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
                                    Für dieses Raumklima liegt aktuell keine Solltemperatur-Steuerung vor.
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
                                    <span className="font-semibold text-gray-900">Auswertungen</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 px-4 pb-4">
                                <Suspense fallback={<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">Lade Verlaufsdaten...</div>}>
                                    <ClimateHistorySection device={device}/>
                                </Suspense>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="recommended" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center gap-2 pr-2">
                                    <Layers size={18}/>
                                    <span className="font-semibold text-gray-900">Empfohlene Szenarien</span>
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
                                            navigate(`/scenarios/${scenario.id}`);
                                        }}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-slate-900">{scenario.name ?? scenario.id}</div>
                                            <ChevronRight size={16} className="ml-auto text-slate-400"/>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">Zuletzt geändert: {formatTime(scenario.modified)}</div>
                                    </button>
                                ))}
                                {recommendedScenarios.length === 0 && DEFAULT_CLIMATE_RECOMMENDATIONS.map((suggestion) => (
                                    <div key={suggestion} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-700">
                                        {suggestion}
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="linked" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center gap-2 pr-2">
                                    <Link2 size={18}/>
                                    <span className="font-semibold text-gray-900">Eingebundene Geräte</span>
                                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{linkedDeviceIds.length}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 px-4 pb-4">
                                {linkedDevices.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        Keine eingebundenen Geräte gefunden.
                                    </div>
                                )}
                                {linkedDevices.map(({id, linkedDevice}) => (
                                    <div key={id} className="rounded-lg border border-gray-200 px-3 py-2">
                                        <div className="font-semibold text-slate-900">{linkedDevice?.config?.name ?? id}</div>
                                        <div className="mt-1 text-xs text-slate-500">{linkedDevice ? `${linkedDevice.type} • ${linkedDevice.serialNumber}` : "Gerät aktuell nicht geladen"}</div>
                                        {linkedDevice && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigate(`/devices/${linkedDevice.id}`);
                                                }}
                                                className="mt-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                Details öffnen
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
                                    <span className="font-semibold text-gray-900">Geräteinfo</span>
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
                                        {label: "Aktiviert", value: device.config.timeOfAcceptance ? formatTime(device.config.timeOfAcceptance) : "-"},
                                        {label: "Raum", value: device.locationData?.config?.name ?? "-"}
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
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"><MapPin size={14}/>{device.locationData?.config?.name ?? "Ohne Raum"}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"><Cpu size={14}/>{device.manufacturer}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"><Package size={14}/>{device.config.modelId}</span>
                            </div>
                        </div>
                        <div className="md:ml-auto flex flex-col gap-3 md:items-end">
                            <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm", socketConnected ? "border-emerald-200/40 bg-emerald-200/20" : "border-amber-200/40 bg-amber-200/20")}><Wifi size={14}/>{socketConnected ? "Realtime verbunden" : "Realtime getrennt"}</span>
                            {onStateCapability && <button type="button" onClick={() => { void toggleOnState(); }} disabled={switchPending} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", onStateValue ? "border-emerald-200/40 bg-emerald-300/20" : "border-white/40 bg-black/20", switchPending && "cursor-not-allowed opacity-70")}><Power size={16}/>{switchPending ? "Speichert..." : onStateValue ? "An" : "Aus"}</button>}
                        </div>
                    </div>
                    <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">Status</div><div className="mt-1 text-sm font-semibold">{onStateValue === undefined ? "Keine Schaltfunktion" : onStateValue ? "Aktiv" : "Inaktiv"}</div></div>
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">Szenarien</div><div className="mt-1 text-sm font-semibold">{relatedScenarios.length}</div></div>
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">Live-Werte</div><div className="mt-1 text-sm font-semibold">{stateRows.length}</div></div>
                        <div className="rounded-lg bg-black/15 p-3"><div className="text-xs uppercase text-white/70">Letzte Änderung</div><div className="mt-1 text-sm font-semibold">{latestStateChange ? formatTime(latestStateChange) : "-"}</div></div>
                    </div>
                </div>

                {(switchError || setpointError) && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{switchError ?? setpointError}</div>}

                <Accordion type="multiple" defaultValue={["controls", "states"]} className="space-y-3">
                    <AccordionItem value="controls" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><SlidersHorizontal size={18}/><span className="font-semibold text-gray-900">Steuerung</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-3">
                            {!onStateCapability && (!setpointCapability || setpointValue === undefined) && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Dieses Gerät hat aktuell keine direkten Steuerfunktionen.</div>}
                            {onStateCapability && <Card className="border-gray-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">Schalter</CardTitle><CardDescription>Direkte Ein/Aus-Steuerung.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-3"><div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">Aktueller Zustand: <span className="font-semibold text-slate-900">{onStateValue ? "An" : "Aus"}</span></div><button type="button" onClick={() => { void toggleOnState(); }} disabled={switchPending} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", onStateValue ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700", switchPending && "cursor-not-allowed opacity-70")}>{switchPending ? "Speichert..." : onStateValue ? "Ausschalten" : "Einschalten"}</button></CardContent></Card>}
                            {setpointCapability && setpointValue !== undefined && <Card className="border-gray-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">Solltemperatur</CardTitle><CardDescription>Speichert automatisch nach kurzer Pause.</CardDescription></CardHeader><CardContent><div className="flex items-end justify-between"><div className="inline-flex items-center gap-2 text-3xl font-semibold text-slate-900"><Thermometer size={24}/>{setpointValue.toFixed(1)} °C</div><div className="text-xs text-slate-500">{setpointPending ? "Speichere..." : "Live"}</div></div><div className="mt-4"><SliderCDN min={6.5} max={30} step={0.5} value={[setpointValue]} onValueChange={(values) => { setSetpointValue(values[0]); }}/></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>6.5 °C</span><span>30.0 °C</span></div></CardContent></Card>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="states" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><Sparkles size={18}/><span className="font-semibold text-gray-900">Live-Zustände</span><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{stateRows.length}</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            {stateGroups.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Keine Zustandsdaten vorhanden.</div>}
                            {stateGroups.length > 0 && <div className="space-y-3">{stateGroups.map((group) => <Card key={group.id} className="border-gray-200 shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base">{group.name}</CardTitle><CardDescription>{group.rows.length} Werte</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{group.rows.map((row) => <div key={`${row.capabilityId}-${row.stateKey}`} className="rounded-lg border border-gray-200 p-3"><div className="text-xs uppercase tracking-wide text-gray-500">{STATE_LABELS[row.stateKey] ?? row.stateKey}</div><div className={cn("mt-2 inline-flex rounded-full border px-2 py-1 text-sm font-semibold", stateBadgeClass(row.stateKey, row.value))}>{formatStateValue(row.stateKey, row.value)}</div><div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500"><Clock3 size={12}/>{row.lastChanged ? formatTime(row.lastChanged) : "-"}</div></div>)}</CardContent></Card>)}</div>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="scenarios" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><Layers size={18}/><span className="font-semibold text-gray-900">Szenarien</span><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{relatedScenarios.length}</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            {relatedScenarios.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Keine passenden Szenarien gefunden.</div>}
                            {relatedScenarios.length > 0 && <div className="space-y-2">{relatedScenarios.map((scenario) => <button type="button" key={scenario.id} onClick={() => { navigate(`/scenarios/${scenario.id}`); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:bg-slate-50"><div className="flex items-center gap-2"><div className="font-semibold text-slate-900">{scenario.name ?? scenario.id}</div><ChevronRight size={16} className="ml-auto text-slate-400"/></div><div className="mt-1 text-xs text-slate-500">Zuletzt geändert: {formatTime(scenario.modified)}</div></button>)}</div>}
                            <button type="button" onClick={() => { navigate("/scenarios"); }} className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Alle Szenarien öffnen</button>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="info" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline"><div className="flex w-full items-center gap-2 pr-2"><Info size={18}/><span className="font-semibold text-gray-900">Geräteinfo</span></div></AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[{label: "ID", value: device.id}, {label: "Seriennummer", value: device.serialNumber}, {label: "Version", value: device.version}, {label: "Protokoll", value: device.config.protocolId}, {label: "Produkt", value: device.product}, {label: "Entdeckt", value: formatTime(device.config.timeOfDiscovery)}, {label: "Aktiviert", value: formatTime(device.config.timeOfAcceptance)}, {label: "Raum", value: device.locationData?.config?.name ?? "-"}].map((row) => <div key={row.label} className="rounded-lg border border-gray-200 p-3"><div className="text-xs uppercase tracking-wide text-gray-500">{row.label}</div><div className="mt-1 text-sm font-semibold text-slate-900">{row.value || "-"}</div></div>)}
                            </div>
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><div className="inline-flex items-center gap-2"><CircleAlert size={14}/>Werte werden in Echtzeit aktualisiert; bei Verbindungsproblemen erfolgt zusätzlich ein Hintergrund-Refresh.</div></div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </PageComponent>
    );
};
