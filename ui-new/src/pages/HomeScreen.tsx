import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {useEffect, useMemo, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import axios from "axios";
import TimeSeriesChart, {DataPoint} from "@/src/components/layout/TimeSeriesChart.tsx";
import {buildHomeSummary, getDevicesForHomeSection} from "@/src/utils/homeSummary.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {House, Lightbulb, MapPin, Thermometer} from "lucide-react";

type CapData = {
    eventType: string,
    eventTime: string,
    dataName: string,
    dataValue: string
    entityId: string
}

export const HomeScreen = () => {
    const allthings = useContentModel(state => state.allThings)
    const [deviceDataStore, setDeviceDataStore] = useState<Map<string, DataPoint[]>>(new Map<string, DataPoint[]>())
    const [loadingDeviceIds, setLoadingDeviceIds] = useState<Set<string>>(new Set<string>())
    const [deviceLoadErrors, setDeviceLoadErrors] = useState<Map<string, string>>(new Map<string, string>())
    const [climateHistoryOpen, setClimateHistoryOpen] = useState<string>("")
    const homeSummary = useMemo(() => buildHomeSummary(allthings?.devices), [allthings?.devices]);
    const homeSectionsWithDevices = useMemo(() => {
        return homeSummary.map((section) => ({
            ...section,
            devices: getDevicesForHomeSection(section.id, allthings?.devices)
        }));
    }, [allthings?.devices, homeSummary]);

    const roomsClimate = useMemo(() => {
        let deviceArrays: Device[] = []
        if (!allthings?.devices) return deviceArrays
        deviceArrays = Object.values(allthings.devices).filter((d) => d.type === "VRCC")
        return deviceArrays || []
    }, [allthings?.devices])

    const loadObject = async (device: Device, capKey: string): Promise<DataPoint[]> => {
        const currentDate = new Date().toISOString()
        const start = new Date()
        start.setHours(start.getHours() - 24)
        const response = await axios.get<CapData[]>('/data/capability', {
            params: {
                entityId: device.manufacturer + "." + device.type + "." + device.serialNumber + capKey,
                start: start.toISOString(),
                end: currentDate,
                page: 1,
                pagesize: 288,
                eventType: "StateChanged"
            }
        })
        const data = response.data
            .map((value) => ({
                timeString: value.eventTime,
                value: parseFloat(value.dataValue)
            }))
            .filter((value) => !Number.isNaN(value.value))
        return data
    }

    const setDeviceLoading = (deviceId: string, loading: boolean) => {
        setLoadingDeviceIds((previous) => {
            const next = new Set(previous)
            if (loading) {
                next.add(deviceId)
            } else {
                next.delete(deviceId)
            }
            return next
        })
    }

    const loadDeviceData = async (device: Device, force = false) => {
        const tempKey = device.id + "temp"
        const humidityKey = device.id + "humidity"

        if (!force && deviceDataStore.has(tempKey) && deviceDataStore.has(humidityKey)) {
            return
        }

        setDeviceLoading(device.id, true)
        setDeviceLoadErrors((previous) => {
            const next = new Map(previous)
            next.delete(device.id)
            return next
        })

        const [temperatureResponse, humidityResponse] = await Promise.allSettled([
            loadObject(device, ".RoomTemperature"),
            loadObject(device, ".RoomHumidity")
        ])

        setDeviceDataStore((previous) => {
            const next = new Map(previous)
            if (temperatureResponse.status === "fulfilled") {
                next.set(tempKey, temperatureResponse.value)
            } else {
                next.set(tempKey, [])
            }

            if (humidityResponse.status === "fulfilled") {
                next.set(humidityKey, humidityResponse.value)
            } else {
                next.set(humidityKey, [])
            }
            return next
        })

        if (temperatureResponse.status === "rejected" && humidityResponse.status === "rejected") {
            setDeviceLoadErrors((previous) => {
                const next = new Map(previous)
                next.set(device.id, "Verlaufsdaten konnten nicht geladen werden.")
                return next
            })
        }

        setDeviceLoading(device.id, false)
    }

    useEffect(() => {
        if (climateHistoryOpen !== "climate-history") {
            return
        }
        roomsClimate.forEach((device) => {
            void loadDeviceData(device)
        })
    }, [climateHistoryOpen, roomsClimate])

    return <PageComponent title="Home">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="SmartHome Übersicht"
                subtitle="Alle Bereiche im Blick. Klappe Sektionen auf, um Geräte direkt zu steuern."
                badges={[
                    {label: `${Object.keys(allthings?.devices ?? {}).length} Geräte`, icon: <House size={14}/>},
                    {label: `${allthings?.locations?.length ?? 0} Räume`, icon: <MapPin size={14}/>},
                    {label: `${roomsClimate.length} Klima-Zonen`, icon: <Thermometer size={14}/>}
                ]}
                stats={[
                    {label: "Beleuchtung", value: homeSectionsWithDevices.find((section) => section.id === "lighting")?.deviceCount ?? 0},
                    {label: "Klima", value: homeSectionsWithDevices.find((section) => section.id === "climate")?.deviceCount ?? 0},
                    {label: "Sicherheit", value: homeSectionsWithDevices.find((section) => section.id === "security")?.deviceCount ?? 0},
                    {label: "Draußen", value: homeSectionsWithDevices.find((section) => section.id === "outside")?.deviceCount ?? 0}
                ]}
            />

            <ModernSection title="Bereiche" description="Status pro Bereich mit aufklappbaren Gerätelisten." icon={<Lightbulb size={18}/>}>
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
                                    <div className="text-gray-500">Noch keine passenden Geräte installiert.</div>
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

            <ModernSection title="Klimaverlauf pro Raum" description="Lade Temperatur und Feuchtigkeit der letzten 24 Stunden.">
                <Accordion type="single" collapsible value={climateHistoryOpen} onValueChange={setClimateHistoryOpen} className="rounded-xl">
                    <AccordionItem value="climate-history" className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-black">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">Verläufe anzeigen</AccordionTrigger>
                        <AccordionContent className="bg-white px-4 pb-4">
                            {roomsClimate.length === 0 && <div className="text-gray-500">Keine Klimageräte vorhanden.</div>}
                            {roomsClimate.map((r) => (
                                <div key={r.id} className="mb-4 rounded-md border border-gray-200 p-3">
                                    <button className="mb-2 font-semibold text-black" onClick={() => void loadDeviceData(r, true)}>
                                        {r.locationData?.config.name ?? r.config.name}
                                    </button>
                                    {loadingDeviceIds.has(r.id) && (
                                        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">Lade Verlaufsdaten...</div>
                                    )}
                                    {deviceLoadErrors.has(r.id) && (
                                        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                                            {deviceLoadErrors.get(r.id)}
                                        </div>
                                    )}
                                    {!loadingDeviceIds.has(r.id) &&
                                        !deviceLoadErrors.has(r.id) &&
                                        deviceDataStore.has(r.id + "temp") &&
                                        deviceDataStore.has(r.id + "humidity") &&
                                        (deviceDataStore.get(r.id + "temp")?.length ?? 0) === 0 &&
                                        (deviceDataStore.get(r.id + "humidity")?.length ?? 0) === 0 && (
                                            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                                                Keine Verlaufsdaten für die letzten 24 Stunden vorhanden.
                                            </div>
                                        )}
                                    {(deviceDataStore.get(r.id + "temp")?.length ?? 0) > 0 && (
                                        <TimeSeriesChart
                                            chartTitle={"Temperatur in " + (r.locationData?.config.name ?? r.config.name)}
                                            ytitle="Temperatur in Grad"
                                            data={deviceDataStore.get(r.id + "temp") || []}
                                        />
                                    )}
                                    {(deviceDataStore.get(r.id + "humidity")?.length ?? 0) > 0 && (
                                        <TimeSeriesChart
                                            chartTitle={"Feuchtigkeit in " + (r.locationData?.config.name ?? r.config.name)}
                                            ytitle="Feuchtigkeit in Prozent"
                                            data={deviceDataStore.get(r.id + "humidity") || []}
                                        />
                                    )}
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </ModernSection>
        </div>
    </PageComponent>
}
