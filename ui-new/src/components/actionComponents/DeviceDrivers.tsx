import {Suspense, useMemo} from "react";
import {HardDrive, Wrench} from "lucide-react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import type {components} from "@/src/api/schema";

type DriverEntry = {
    id: string,
    name: string,
    version: string
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
    if (lowered.includes("geraete") || lowered.includes("geräte") || lowered.includes("devices")) {
        return name;
    }
    return `${name} Geräte`;
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

const normalizeDrivers = (products: components["schemas"]["ProductDoc"][]): DriverEntry[] => {
    const drivers: DriverEntry[] = [];

    products.forEach((product, index) => {
        const type = asText(product.type);
        if (!type || !type.includes("Devices.")) {
            return;
        }

        const isProvisioned = typeof product.provisioned === "boolean" ? product.provisioned : true;
        if (!isProvisioned) {
            return;
        }

        const config = isRecord(product.config) ? product.config : undefined;
        const state = isRecord(product.state) ? product.state : undefined;
        const status = asText(state?.status) ?? asText(state?.state);
        if (status) {
            const lowered = status.toLowerCase();
            if (lowered.includes("uninstall") || lowered.includes("remove") || lowered.includes("delete")) {
                return;
            }
        }

        const name = getDriverDisplayName(type, config);
        const version = asText(state?.fullVersion) ?? asText(product.version) ?? "-";
        const id = asText(product.id) ?? `${type}-${index}`;

        drivers.push({id, name, version});
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

    const versioned = normalized.filter((entry) => entry.version !== "-");
    return versioned.length > 0 ? versioned : normalized;
}

const DeviceDriversContent = () => {
    const {data} = apiQueryClient.useSuspenseQuery("get", "/product");
    const drivers = useMemo(() => normalizeDrivers(data ?? []), [data]);
    const versionedCount = useMemo(() => drivers.filter((entry) => entry.version !== "-").length, [drivers]);

    return (
        <PageComponent title="Gerätetreiber" to="/settings">
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
                        {label: "Status", value: "Aktiv"}
                    ]}
                />

                <ModernSection
                    title="Installierte Gerätetreiber"
                    description="Name und installierte Version."
                    icon={<Wrench size={18}/>}
                >
                    {drivers.length === 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-600">
                            Keine installierten Gerätetreiber gefunden.
                        </div>
                    )}

                    {drivers.length > 0 && (
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
    );
};

export const DeviceDrivers = ()=>{
    return (
        <Suspense fallback={<PageSkeleton cards={3}/>}>
            <DeviceDriversContent/>
        </Suspense>
    );
};
