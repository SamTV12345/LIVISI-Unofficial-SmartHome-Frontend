import {useMemo, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useContentModel} from "@/src/store.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Activity, Filter, Search} from "lucide-react";
import {formatTime} from "@/src/utils/timeUtils.ts";

type StateRow = {
    id: string,
    deviceName: string,
    locationName: string,
    key: string,
    value: string,
    lastChanged: string
}

const stringifyValue = (value: unknown): string => {
    if (typeof value === "boolean") return value ? "An" : "Aus";
    if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
    if (value === null || value === undefined) return "-";
    return String(value);
};

const valueClassName = (value: string): string => {
    const normalized = value.toLowerCase();
    if (normalized === "an" || normalized === "online" || normalized === "geschlossen") return "border-emerald-200 bg-emerald-100 text-emerald-700";
    if (normalized === "aus" || normalized === "offline" || normalized === "offen") return "border-amber-200 bg-amber-100 text-amber-700";
    return "border-slate-200 bg-slate-100 text-slate-700";
};

export const StatesScreen = () => {
    const allThings = useContentModel((state) => state.allThings);
    const [search, setSearch] = useState("");

    const rows = useMemo(() => {
        const devices = Object.values(allThings?.devices ?? {});
        const output: StateRow[] = [];

        for (const device of devices) {
            const deviceName = device.config?.name ?? device.id;
            const locationName = device.locationData?.config?.name ?? "Unbekannter Ort";
            for (const capabilityState of device.capabilityState ?? []) {
                const state = capabilityState.state ?? {};
                for (const [key, rawState] of Object.entries(state)) {
                    const value = (rawState as { value?: unknown })?.value;
                    const lastChanged = (rawState as { lastChanged?: string })?.lastChanged ?? "-";
                    output.push({
                        id: `${device.id}-${capabilityState.id}-${key}`,
                        deviceName,
                        locationName,
                        key,
                        value: stringifyValue(value),
                        lastChanged
                    });
                }
            }
        }

        return output.sort((a, b) => b.lastChanged.localeCompare(a.lastChanged));
    }, [allThings?.devices]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter((row) =>
            row.deviceName.toLowerCase().includes(query)
            || row.locationName.toLowerCase().includes(query)
            || row.key.toLowerCase().includes(query)
            || row.value.toLowerCase().includes(query));
    }, [rows, search]);

    return (
        <PageComponent title="Zustände">
            <div className="space-y-5 p-4 md:p-6">
                <ModernHero
                    title="Live-Zustände"
                    subtitle="Alle aktuellen Zustandswerte zentral und filterbar."
                    badges={[
                        {label: `${rows.length} Werte`, icon: <Activity size={14}/>},
                        {label: `${Object.keys(allThings?.devices ?? {}).length} Geräte`, icon: <Filter size={14}/>}
                    ]}
                    stats={[
                        {label: "Gesamt", value: rows.length},
                        {label: "Gefiltert", value: filteredRows.length},
                        {label: "Suche", value: search.trim() ? "Aktiv" : "Inaktiv"},
                        {label: "Neuester Wert", value: rows[0]?.lastChanged ? formatTime(rows[0].lastChanged) : "-"}
                    ]}
                />

                <ModernSection title="Filter" description="Suche nach Gerät, Raum oder Zustandsnamen." icon={<Search size={18}/>}>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Suche nach Gerät, Ort oder Zustand"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    />
                </ModernSection>

                <ModernSection title="Ergebnisse" description={`${filteredRows.length} Einträge`}>
                    {filteredRows.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Keine Zustände gefunden.</div>}
                    {filteredRows.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {filteredRows.map((row) => (
                                <div key={row.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex flex-wrap items-start gap-2">
                                        <div>
                                            <div className="text-base font-semibold text-slate-900">{row.deviceName}</div>
                                            <div className="text-xs text-slate-500">{row.locationName} · {row.key}</div>
                                        </div>
                                        <span className={`ml-auto inline-flex rounded-full border px-2 py-1 text-sm font-semibold ${valueClassName(row.value)}`}>
                                            {row.value}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        {row.lastChanged && row.lastChanged !== "-" ? formatTime(row.lastChanged) : "-"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ModernSection>
            </div>
        </PageComponent>
    );
};
