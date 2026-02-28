import {useMemo, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {TYPES, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/src/constants/FieldConstants.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {useTranslation} from "react-i18next";
import {Device} from "@/src/models/Device.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {House, Layers, MapPin} from "lucide-react";
import {cn} from "@/src/utils/cn-helper.ts";

export const DeviceScreen = () => {
    const [selectedTab, setSelectedTab] = useState<"location" | "type">("location");
    const allDevices = useContentModel((state) => state.allThings);
    const {t} = useTranslation();

    const mappedDevicesToType = useMemo(() => {
        if (!allDevices?.devices) return undefined;
        const map = new Map<string, Device[]>();
        TYPES.forEach((type) => {
            if (type !== ZWISCHENSTECKER_OUTDOOR) {
                map.set(type, []);
            }
        });
        for (const devDevice of Object.values(allDevices.devices)) {
            if (devDevice.type === ZWISCHENSTECKER_OUTDOOR) {
                map.get(ZWISCHENSTECKER)?.push(devDevice);
                continue;
            }
            map.get(devDevice.type)?.push(devDevice);
        }
        return map;
    }, [allDevices?.devices]);

    const locationCount = allDevices?.locations?.length ?? 0;
    const deviceCount = Object.values(allDevices?.devices ?? {}).length;
    const typeCount = mappedDevicesToType ? [...mappedDevicesToType.values()].filter((devices) => devices.length > 0).length : 0;

    return <PageComponent title={t('HouseholdIdDevicesTag')}>
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="Geräteübersicht"
                subtitle="Alle Geräte nach Ort oder Typ gruppiert. Live-Daten aktualisieren sich automatisch."
                badges={[
                    {label: `${deviceCount} Geräte`, icon: <House size={14}/>},
                    {label: `${locationCount} Räume`, icon: <MapPin size={14}/>},
                    {label: `${typeCount} aktive Typen`, icon: <Layers size={14}/>}
                ]}
                stats={[
                    {label: "Ansicht", value: selectedTab === "location" ? "Nach Ort" : "Nach Typ"},
                    {label: "Räume", value: locationCount},
                    {label: "Geräte", value: deviceCount},
                    {label: "Typen", value: typeCount}
                ]}
            />

            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                    type="button"
                    className={cn(
                        "rounded-md px-4 py-2 text-sm font-semibold transition",
                        selectedTab === "location" ? "bg-cyan-100 text-cyan-800" : "text-slate-600 hover:bg-gray-100"
                    )}
                    onClick={() => setSelectedTab("location")}
                >
                    Ort
                </button>
                <button
                    type="button"
                    className={cn(
                        "rounded-md px-4 py-2 text-sm font-semibold transition",
                        selectedTab === "type" ? "bg-cyan-100 text-cyan-800" : "text-slate-600 hover:bg-gray-100"
                    )}
                    onClick={() => setSelectedTab("type")}
                >
                    Gerätetyp
                </button>
            </div>

            {selectedTab === "location" && (
                <ModernSection title="Geräte nach Ort" description="Öffne einen Ort, um die zugehörigen Geräte zu sehen.">
                    <Accordion type="multiple" className="space-y-2">
                        {allDevices?.locations?.map((location) => {
                            const matchingDevices = (location.devices ?? [])
                                .filter((deviceId) => TYPES.includes(allDevices?.devices[deviceId].type))
                                .map((deviceId) => allDevices?.devices[deviceId])
                                .filter((device): device is Device => Boolean(device));

                            return <AccordionItem key={location.id} value={location.id} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex w-full items-center gap-2 pr-2">
                                        <span className="font-semibold text-slate-900">{location.config.name}</span>
                                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                                            {matchingDevices.length}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-white px-3 pb-3">
                                    {matchingDevices.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">Keine passenden Geräte in diesem Ort.</div>}
                                    {matchingDevices.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{matchingDevices.map((device) => <DeviceDecider device={device} key={device.id}/>)}</div>}
                                </AccordionContent>
                            </AccordionItem>
                        })}
                    </Accordion>
                </ModernSection>
            )}

            {selectedTab === "type" && (
                <ModernSection title="Geräte nach Typ" description="Alle registrierten Gerätetypen mit ihren Einträgen.">
                    <Accordion type="multiple" className="space-y-2">
                        {mappedDevicesToType && [...mappedDevicesToType.entries()].map(([key, devices]) => (
                            <AccordionItem key={key} value={key} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex w-full items-center gap-2 pr-2">
                                        <span className="font-semibold text-slate-900">{t(key)}</span>
                                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                                            {devices.length}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-white px-3 pb-3">
                                    {devices.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">Keine Geräte dieses Typs vorhanden.</div>}
                                    {devices.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{devices.map((device) => <DeviceDecider device={device} key={device.id}/>)}</div>}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ModernSection>
            )}
        </div>
    </PageComponent>
}
