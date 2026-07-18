import {Suspense, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useContentModel} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import TimeSeriesChart, {DataPoint} from "@/src/components/layout/TimeSeriesChart.tsx";
import {cn} from "@/src/utils/cn-helper.ts";

type CapabilityHistoryRow = {
    eventType: string,
    eventTime: string,
    dataName: string,
    dataValue: string,
    entityId: string
}

type RangeKey = "24h" | "7d" | "30d";

const RANGES: Record<RangeKey, { hours: number, labelKey: string }> = {
    "24h": {hours: 24, labelKey: "ui_new.history.range_24h"},
    "7d": {hours: 24 * 7, labelKey: "ui_new.history.range_7d"},
    "30d": {hours: 24 * 30, labelKey: "ui_new.history.range_30d"}
};

// ponytail: capabilities with a numeric state value are the only chartable ones
const numericCapabilities = (device: Device) => {
    const numericIds = new Set(
        (device.capabilityState ?? [])
            .filter((capability) => Object.values(capability.state ?? {}).some((state) => typeof (state as { value?: unknown })?.value === "number"))
            .map((capability) => capability.id)
    );
    return (device.capabilityData ?? []).filter((capability) => numericIds.has(capability.id));
};

const HistoryChart = ({device, capabilityType, hours}: { device: Device, capabilityType: string, hours: number }) => {
    const {t} = useTranslation();
    // end is quantized to the minute so the query key stays stable across renders
    const queryParams = useMemo(() => {
        const end = new Date(Math.floor(Date.now() / 60000) * 60000);
        const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
        return {
            params: {
                query: {
                    entityId: `${device.manufacturer}.${device.type}.${device.serialNumber}.${capabilityType}`,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    page: 1,
                    pagesize: 2000,
                    eventType: "StateChanged"
                }
            }
        };
    }, [capabilityType, device.manufacturer, device.serialNumber, device.type, hours]);

    const {data} = apiQueryClient.useSuspenseQuery("get", "/data/capability", queryParams);
    const points: DataPoint[] = useMemo(() => ((data as CapabilityHistoryRow[] | undefined) ?? [])
        .map((row) => ({timeString: row.eventTime, value: Number.parseFloat(row.dataValue)}))
        .filter((point) => Number.isFinite(point.value)), [data]);

    if (points.length === 0) {
        return <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">{t("ui_new.history.no_data")}</div>;
    }
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-2">
            <TimeSeriesChart data={points} chartTitle={capabilityType} ytitle={t("ui_new.history.value")}/>
        </div>
    );
};

export const HistoryScreen = () => {
    const {t} = useTranslation();
    const params = useParams<{ deviceId: string }>();
    const allThings = useContentModel((state) => state.allThings);
    const device = params.deviceId ? allThings?.devices?.[params.deviceId] : undefined;
    const capabilities = useMemo(() => device ? numericCapabilities(device) : [], [device]);
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [range, setRange] = useState<RangeKey>("24h");
    const capabilityType = selectedType ?? capabilities[0]?.type;

    if (!allThings) {
        return <PageComponent title={t("ui_new.history.title")} to="/devices"><div className="p-4 md:p-6 text-gray-500">{t("ui_new.device_detail.loading_data")}</div></PageComponent>;
    }
    if (!device) {
        return <PageComponent title={t("ui_new.history.title")} to="/devices"><div className="p-4 md:p-6 text-gray-500">{t("ui_new.device_detail.not_found")}</div></PageComponent>;
    }

    return (
        <PageComponent title={`${t("ui_new.history.title")} – ${device.config.name}`} to={`/devices/${device.id}`}>
            <div className="space-y-4 p-4 md:p-6">
                {capabilities.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">{t("ui_new.history.no_capabilities")}</div>
                )}
                {capabilities.length > 0 && (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="text-sm text-slate-700 dark:text-slate-300" htmlFor="history-capability">{t("ui_new.history.capability")}</label>
                            <select
                                id="history-capability"
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                value={capabilityType}
                                onChange={(event) => setSelectedType(event.target.value)}
                            >
                                {capabilities.map((capability) => (
                                    <option key={capability.id} value={capability.type}>{capability.config?.name ?? capability.type}</option>
                                ))}
                            </select>
                            <div className="ml-auto flex gap-2">
                                {(Object.keys(RANGES) as RangeKey[]).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setRange(key)}
                                        className={cn(
                                            "rounded-lg border px-3 py-2 text-sm font-semibold",
                                            range === key ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        {t(RANGES[key].labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {capabilityType && (
                            <Suspense fallback={<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">{t("ui_new.device_detail.loading_history")}</div>}>
                                <HistoryChart device={device} capabilityType={capabilityType} hours={RANGES[range].hours}/>
                            </Suspense>
                        )}
                    </>
                )}
            </div>
        </PageComponent>
    );
};
