import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {Suspense, useMemo, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import TimeSeriesChart, {DataPoint} from "@/src/components/layout/TimeSeriesChart.tsx";
import {buildHomeSummary, getDevicesForHomeSection} from "@/src/utils/homeSummary.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {House, Lightbulb, MapPin, RefreshCw, Thermometer} from "lucide-react";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {useTranslation} from "react-i18next";

type CapabilityHistoryRow = {
    eventType: string,
    eventTime: string,
    dataName: string,
    dataValue: string,
    entityId: string
};

type HistoryWindow = {
    start: string,
    end: string
};

const createHistoryWindow = (): HistoryWindow => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
};

const toDataPoints = (rows: CapabilityHistoryRow[]): DataPoint[] => {
    return rows
        .map((row) => ({
            timeString: row.eventTime,
            value: Number.parseFloat(row.dataValue)
        }))
        .filter((row) => Number.isFinite(row.value));
};

const RoomClimateHistorySkeleton = ({roomName}: {roomName: string}) => {
    const {t} = useTranslation();
    return (
        <div className="mb-4 rounded-md border border-gray-200 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-800">{roomName}</div>
            <div className="space-y-3 animate-pulse">
                <div className="h-40 rounded-lg border border-gray-200 bg-gray-100"/>
                <div className="h-40 rounded-lg border border-gray-200 bg-gray-100"/>
            </div>
            <div className="mt-2 text-xs text-slate-500">{t("ui_new.home.loading_history")}</div>
        </div>
    );
};

const RoomClimateHistoryCard = ({device, timeWindow}: {device: Device, timeWindow: HistoryWindow}) => {
    const {t} = useTranslation();
    const temperatureEntity = `${device.manufacturer}.${device.type}.${device.serialNumber}.RoomTemperature`;
    const humidityEntity = `${device.manufacturer}.${device.type}.${device.serialNumber}.RoomHumidity`;

    const temperatureParams = useMemo(() => ({
        params: {
            query: {
                entityId: temperatureEntity,
                start: timeWindow.start,
                end: timeWindow.end,
                page: 1,
                pagesize: 288,
                eventType: "StateChanged"
            }
        }
    }), [temperatureEntity, timeWindow.end, timeWindow.start]);

    const humidityParams = useMemo(() => ({
        params: {
            query: {
                entityId: humidityEntity,
                start: timeWindow.start,
                end: timeWindow.end,
                page: 1,
                pagesize: 288,
                eventType: "StateChanged"
            }
        }
    }), [humidityEntity, timeWindow.end, timeWindow.start]);

    const {data: temperatureResponse} = apiQueryClient.useSuspenseQuery("get", "/data/capability", temperatureParams);
    const {data: humidityResponse} = apiQueryClient.useSuspenseQuery("get", "/data/capability", humidityParams);

    const temperatureData = useMemo(() => toDataPoints((temperatureResponse) ?? []), [temperatureResponse]);
    const humidityData = useMemo(() => toDataPoints((humidityResponse) ?? []), [humidityResponse]);

    const refreshRoomHistory = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: apiQueryClient.queryOptions("get", "/data/capability", temperatureParams).queryKey
            }),
            queryClient.invalidateQueries({
                queryKey: apiQueryClient.queryOptions("get", "/data/capability", humidityParams).queryKey
            })
        ]);
    };

    const roomName = device.locationData?.config.name ?? device.config.name;

    return (
        <div className="mt-4 rounded-md border border-gray-200 p-3">
            <div className="mb-3 flex items-center gap-2">
                <button
                    type="button"
                    className="font-semibold text-black dark:text-slate-100 hover:underline"
                    onClick={() => {
                        void refreshRoomHistory();
                    }}
                >
                    {roomName}
                </button>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                        void refreshRoomHistory();
                    }}
                >
                    <RefreshCw size={12}/>
                    {t("ui_new.common.refresh")}
                </button>
            </div>

            {temperatureData.length === 0 && humidityData.length === 0 && (
                <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                    {t("ui_new.home.no_history_24h")}
                </div>
            )}
            {temperatureData.length > 0 && (
                <TimeSeriesChart
                    chartTitle={t("ui_new.home.temperature_in_room", {roomName})}
                    ytitle={t("ui_new.home.temperature_unit_label")}
                    data={temperatureData}
                />
            )}
            {humidityData.length > 0 && (
                <TimeSeriesChart
                    chartTitle={t("ui_new.home.humidity_in_room", {roomName})}
                    ytitle={t("ui_new.home.humidity_unit_label")}
                    data={humidityData}
                />
            )}
        </div>
    );
};

export const HomeScreen = () => {
    const allthings = useContentModel((state) => state.allThings);
    const {t} = useTranslation();
    const [climateHistoryOpen, setClimateHistoryOpen] = useState<string>("");
    const [historyWindow] = useState<HistoryWindow>(() => createHistoryWindow());
    const homeSummary = useMemo(() => buildHomeSummary(allthings?.devices), [allthings?.devices]);
    const homeSectionsWithDevices = useMemo(() => {
        return homeSummary.map((section) => ({
            ...section,
            devices: getDevicesForHomeSection(section.id, allthings?.devices)
        }));
    }, [allthings?.devices, homeSummary]);

    const roomsClimate = useMemo(() => {
        if (!allthings?.devices) return [];
        return Object.values(allthings.devices).filter((device) => device.type === "VRCC");
    }, [allthings?.devices]);

    return <PageComponent title={t("ui_new.home.page_title")}>
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={t("ui_new.home.hero_title")}
                subtitle={t("ui_new.home.hero_subtitle")}
                badges={[
                    {label: t("ui_new.home.devices_count", {count: Object.keys(allthings?.devices ?? {}).length}), icon: <House size={14}/>},
                    {label: t("ui_new.home.rooms_count", {count: allthings?.locations?.length ?? 0}), icon: <MapPin size={14}/>},
                    {label: t("ui_new.home.climate_zones_count", {count: roomsClimate.length}), icon: <Thermometer size={14}/>}
                ]}
                stats={[
                    {label: t("ui_new.home.stats_lighting"), value: homeSectionsWithDevices.find((section) => section.id === "lighting")?.deviceCount ?? 0},
                    {label: t("ui_new.home.stats_climate"), value: homeSectionsWithDevices.find((section) => section.id === "climate")?.deviceCount ?? 0},
                    {label: t("ui_new.home.stats_security"), value: homeSectionsWithDevices.find((section) => section.id === "security")?.deviceCount ?? 0},
                    {label: t("ui_new.home.stats_outside"), value: homeSectionsWithDevices.find((section) => section.id === "outside")?.deviceCount ?? 0}
                ]}
            />

            <ModernSection title={t("ui_new.home.sections_title")} description={t("ui_new.home.sections_description")} icon={<Lightbulb size={18}/>}>
                <Accordion type="multiple" className="overflow-hidden rounded-md">
                    {homeSectionsWithDevices.map((section) => (
                        <AccordionItem key={section.id} value={section.id} className="border-b border-white/20">
                            <AccordionTrigger className={`${section.colorClass} hover:no-underline px-6 py-6 text-white`}>
                                <div className="flex w-full items-center gap-3 pr-4">
                                    <div className="text-left">
                                        <div className="text-2xl font-light uppercase tracking-wide">{section.title}</div>
                                        <div className="mt-2 font-semibold">{section.subtitle}</div>
                                    </div>
                                    <span className="flex-1"></span>
                                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                                        {section.deviceCount}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-white px-4 py-4">
                                {section.devices.length === 0 && (
                                    <div className="text-gray-500">{t("ui_new.home.no_devices_for_section")}</div>
                                )}
                                {section.devices.length > 0 && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {section.devices.map((device) => (
                                            <DeviceDecider key={device.id} device={device}/>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </ModernSection>

            <ModernSection title={t("ui_new.home.climate_history_title")} description={t("ui_new.home.climate_history_description")}>
                <Accordion type="single" collapsible value={climateHistoryOpen} onValueChange={setClimateHistoryOpen} className="rounded-xl">
                    <AccordionItem value="climate-history" className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-black">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline dark:text-slate-100">{t("ui_new.home.show_histories")}</AccordionTrigger>
                        <AccordionContent className="bg-white px-4 pb-4">
                            {roomsClimate.length === 0 && <div className="text-gray-500">{t("ui_new.home.no_climate_devices")}</div>}
                            {roomsClimate.map((roomDevice) => (
                                <Suspense key={roomDevice.id} fallback={<RoomClimateHistorySkeleton roomName={roomDevice.locationData?.config.name ?? roomDevice.config.name}/>}>
                                    <RoomClimateHistoryCard device={roomDevice} timeWindow={historyWindow}/>
                                </Suspense>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </ModernSection>
        </div>
    </PageComponent>;
};
