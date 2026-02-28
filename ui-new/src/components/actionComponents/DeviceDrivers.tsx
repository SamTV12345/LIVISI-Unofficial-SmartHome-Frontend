import {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {HardDrive, Wrench} from "lucide-react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";

type DriverEntry = {
    id: string,
    name: string,
    version: string
}

type ProductEntry = {
    id?: unknown,
    type?: unknown,
    version?: unknown,
    provisioned?: unknown,
    generic?: unknown,
    state?: unknown,
    config?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

const asText = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return undefined;
}

const withDeviceSuffix = (name: string): string => {
    const lowered = name.toLowerCase();
    if (lowered.includes("geräte") || lowered.includes("geraete") || lowered.includes("devices")) {
        return name;
    }
    return `${name} Geräte`;
}

const asArray = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
        return value;
    }
    if (isRecord(value)) {
        const keyCandidates = ["products", "product", "items", "data", "result", "ok"];
        for (const key of keyCandidates) {
            const found = value[key];
            if (Array.isArray(found)) {
                return found;
            }
        }

        const values = Object.values(value);
        if (values.every((entry) => isRecord(entry))) {
            return values;
        }
    }
    return [];
}

const isInstalled = (entry: Record<string, unknown>): boolean => {
    const explicitInstalled = entry.installed;
    if (typeof explicitInstalled === "boolean") {
        return explicitInstalled;
    }

    const status = asText(entry.status) ?? asText(entry.state);
    if (!status) {
        return true;
    }

    const lowered = status.toLowerCase();
    return !lowered.includes("uninstall") && !lowered.includes("remove") && !lowered.includes("delete");
}

const getDriverDisplayName = (type: string, config: Record<string, unknown> | undefined): string => {
    const explicitMappings: Record<string, string> = {
        "CosipDevices.RWE": "innogy Geräte",
        "BLEDevices.Medion": "MEDION Geräte"
    };
    const mapped = explicitMappings[type];
    if (mapped) {
        return mapped;
    }

    const fromConfig =
        asText(config?.name) ??
        asText(config?.application);
    if (fromConfig) {
        return withDeviceSuffix(fromConfig);
    }

    const vendorFromType = type.split(".")[1];
    if (vendorFromType) {
        return withDeviceSuffix(vendorFromType.toUpperCase());
    }

    return withDeviceSuffix(type);
}

const normalizeDrivers = (payload: unknown): DriverEntry[] => {
    const rows = asArray(payload);
    const drivers: DriverEntry[] = [];

    rows.forEach((row, index) => {
        if (!isRecord(row)) {
            return;
        }

        const product = row as ProductEntry;
        const type = asText(product.type);
        if (!type || !type.includes("Devices.")) {
            return;
        }

        const isProvisioned = typeof product.provisioned === "boolean" ? product.provisioned : true;
        if (!isProvisioned || !isInstalled(row)) {
            return;
        }

        const config = isRecord(product.config) ? product.config : undefined;
        const state = isRecord(product.state) ? product.state : undefined;

        const name = getDriverDisplayName(type, config);

        const version =
            asText(state?.fullVersion) ??
            asText(product.version) ??
            asText(row.installedVersion) ??
            asText(row.currentVersion) ??
            asText(config?.version) ??
            "-";

        const id =
            asText(product.id) ??
            type ??
            `${name}-${index}`;

        drivers.push({
            id,
            name,
            version
        });
    });

    const deduplicated = new Map<string, DriverEntry>();
    for (const driver of drivers) {
        const key = driver.name.toLowerCase();
        const existing = deduplicated.get(key);
        if (!existing || (existing.version === "-" && driver.version !== "-")) {
            deduplicated.set(key, driver);
        }
    }

    const normalized = Array.from(deduplicated.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "de", {sensitivity: "base"})
    );
    const versioned = normalized.filter((driver) => driver.version !== "-");
    return versioned.length > 0 ? versioned : normalized;
}

export const DeviceDrivers = ()=>{
    const [drivers, setDrivers] = useState<DriverEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        let active = true;

        const loadDrivers = async () => {
            setLoading(true);
            setError(undefined);
            try {
                const response = await axios.get<unknown>("/product");
                const parsed = normalizeDrivers(response.data);
                if (!active) {
                    return;
                }
                setDrivers(parsed);
            } catch {
                if (!active) {
                    return;
                }
                setDrivers([]);
                setError("Gerätetreiber konnten nicht geladen werden.");
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadDrivers();

        return () => {
            active = false;
        };
    }, []);

    const versionedCount = useMemo(() => {
        return drivers.filter((entry) => entry.version !== "-").length;
    }, [drivers]);

    return <PageComponent title="Gerätetreiber" to="/settings">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="Gerätetreiber"
                subtitle="Installierte Treiber und Versionsstände der Zentrale."
                badges={[
                    {label: `${drivers.length} installiert`, icon: <HardDrive size={14}/>}
                ]}
                stats={[
                    {label: "Installiert", value: drivers.length},
                    {label: "Mit Version", value: versionedCount},
                    {label: "Quelle", value: "/product"},
                    {label: "Status", value: loading ? "Lädt..." : error ? "Fehler" : "Aktiv"}
                ]}
            />

            <ModernSection
                title="Installierte Gerätetreiber"
                description="Name und installierte Version."
                icon={<Wrench size={18}/>}
            >
                {loading && (
                    <div className="space-y-2">
                        {[0, 1, 2].map((skeleton) => (
                            <div key={skeleton} className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 px-3 py-4">
                                <div className="h-4 w-40 rounded bg-gray-200"/>
                                <div className="mt-2 h-3 w-24 rounded bg-gray-200"/>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {!loading && !error && drivers.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-600">
                        Keine installierten Gerätetreiber gefunden.
                    </div>
                )}

                {!loading && !error && drivers.length > 0 && (
                    <div className="divide-y divide-gray-100">
                        {drivers.map((driver) => (
                            <div key={driver.id} className="py-3 first:pt-0 last:pb-0">
                                <div className="font-semibold text-slate-900">{driver.name}</div>
                                <div className="text-sm text-slate-500">Version {driver.version}</div>
                            </div>
                        ))}
                    </div>
                )}
            </ModernSection>
        </div>
    </PageComponent>
}
