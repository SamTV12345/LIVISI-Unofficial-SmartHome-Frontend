import {Suspense, useMemo} from "react";
import {HardDrive, Wrench} from "lucide-react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import type {components} from "@/src/api/schema";
import {useTranslation} from "react-i18next";
import {i18next} from "@/src/language/i18n.ts";

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
        "CosipDevices.RWE": i18next.t("ui_new.device_drivers.vendor_innogy"),
        "BLEDevices.Medion": i18next.t("ui_new.device_drivers.vendor_medion")
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
    const {t} = useTranslation();
    const {data} = apiQueryClient.useSuspenseQuery("get", "/product");
    const drivers = useMemo(() => normalizeDrivers(data ?? []), [data]);
    const versionedCount = useMemo(() => drivers.filter((entry) => entry.version !== "-").length, [drivers]);

    return (
        <PageComponent title={t("ui_new.device_drivers.page_title")} to="/settings">
            <div className="space-y-5 p-4 md:p-6">
                <ModernHero
                    title={t("ui_new.device_drivers.hero_title")}
                    subtitle={t("ui_new.device_drivers.hero_subtitle")}
                    badges={[
                        {label: t("ui_new.device_drivers.installed_badge", {count: drivers.length}), icon: <HardDrive size={14}/>}
                    ]}
                    stats={[
                        {label: t("ui_new.device_drivers.stats_installed"), value: drivers.length},
                        {label: t("ui_new.device_drivers.stats_with_version"), value: versionedCount},
                        {label: t("ui_new.device_drivers.stats_source"), value: "/product"},
                        {label: t("ui_new.common.status"), value: t("ui_new.common.active")}
                    ]}
                />

                <ModernSection
                    title={t("ui_new.device_drivers.section_title")}
                    description={t("ui_new.device_drivers.section_description")}
                    icon={<Wrench size={18}/>}
                >
                    {drivers.length === 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-600">
                            {t("ui_new.device_drivers.empty")}
                        </div>
                    )}

                    {drivers.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {drivers.map((driver) => (
                                <div key={driver.id} className="py-3 first:pt-0 last:pb-0">
                                    <div className="font-semibold text-slate-900">{driver.name}</div>
                                    <div className="text-sm text-slate-500">{t("ui_new.common.version")} {driver.version}</div>
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
