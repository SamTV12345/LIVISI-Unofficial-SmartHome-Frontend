import {useMemo, useState} from "react";
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {useContentModel} from "@/store/store";
import {AppScreen} from "@/components/ui/AppScreen";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {StatusPill} from "@/components/ui/StatusPill";
import {ActionButton} from "@/components/ui/ActionButton";
import {sendDeviceAction} from "@/lib/api";
import {Device} from "@/models/Device";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import i18n from "@/i18n/i18n";
import {FENSTERKONTAKT, HEATING, RAUCHMELDER, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";

type CapabilityEntry = {
    id: string;
    state?: Record<string, {value: unknown; lastChanged?: string}>;
};

const findCapability = (device: Device, key: string): CapabilityEntry | undefined => {
    return (device.capabilityState ?? []).find((entry) => entry.state && Object.prototype.hasOwnProperty.call(entry.state, key)) as CapabilityEntry | undefined;
};

const readNumber = (entry: CapabilityEntry | undefined, key: string): number | undefined => {
    const value = entry?.state?.[key]?.value;
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
};

const readBoolean = (entry: CapabilityEntry | undefined, key: string): boolean => {
    return Boolean(entry?.state?.[key]?.value);
};

const buildAction = (device: Device, capabilityId: string, params: Record<string, {type: "Constant"; value: unknown}>) => ({
    id: capabilityId,
    target: `/capability/${capabilityId}`,
    namespace: device.product || `core.${device.manufacturer}`,
    type: "SetState",
    params
});

export default function DeviceDetailScreen() {
    const {deviceId} = useLocalSearchParams<{deviceId: string}>();
    const allThings = useContentModel((state) => state.allThings);
    const gateway = useContentModel((state) => state.gateway);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const [isSaving, setIsSaving] = useState(false);
    const [localOnState, setLocalOnState] = useState<boolean | undefined>(undefined);
    const [localSetpoint, setLocalSetpoint] = useState<number | undefined>(undefined);

    const device = deviceId ? allThings?.devices?.[deviceId] : undefined;
    const locationName = useMemo(() => {
        if (!device) {
            return undefined;
        }
        return allThings?.locations.find((entry) => entry.id === device.location)?.config.name;
    }, [allThings?.locations, device]);

    if (!device) {
        return (
            <AppScreen title="Gerätedetails" subtitle="Gerät wurde nicht gefunden.">
                <SurfaceCard>
                    <Text>Dieses Gerät ist aktuell nicht in den geladenen Daten vorhanden.</Text>
                </SurfaceCard>
            </AppScreen>
        );
    }

    const onStateCapability = findCapability(device, "onState");
    const setpointCapability = findCapability(device, "setpointTemperature");
    const temperatureCapability = findCapability(device, "temperature");
    const humidityCapability = findCapability(device, "humidity");
    const windowCapability = findCapability(device, "isOpen");
    const smokeCapability = findCapability(device, "isSmokeAlarm");

    const isSwitchDevice = device.type === ZWISCHENSTECKER || device.type === ZWISCHENSTECKER_OUTDOOR;
    const isHeating = device.type === HEATING;
    const isWindow = device.type === FENSTERKONTAKT;
    const isSmoke = device.type === RAUCHMELDER;

    const currentOnState = localOnState ?? readBoolean(onStateCapability, "onState");
    const setpoint = localSetpoint ?? readNumber(setpointCapability, "setpointTemperature") ?? 20;
    const currentTemp = readNumber(temperatureCapability, "temperature");
    const currentHumidity = readNumber(humidityCapability, "humidity");
    const isOpen = readBoolean(windowCapability, "isOpen");
    const smokeDetected = readBoolean(smokeCapability, "isSmokeAlarm");

    const capabilityEntries = (device.capabilityState ?? []) as CapabilityEntry[];

    const runAction = async (capabilityId: string | undefined, params: Record<string, {type: "Constant"; value: unknown}>) => {
        if (!gateway?.baseURL || !capabilityId || isSaving) {
            return;
        }
        setIsSaving(true);
        try {
            await sendDeviceAction(gateway, buildAction(device, capabilityId, params));
        } catch {
            Alert.alert("Aktion fehlgeschlagen", "Die Änderung konnte nicht gespeichert werden.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppScreen title={device.config?.name || device.id} subtitle={locationName ?? i18n.t(device.type)} scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}

                <SectionHeader title="Status"/>
                <SurfaceCard style={{marginBottom: 14}}>
                    <Text style={styles.metaText}>Typ: {i18n.t(device.type)} ({device.type})</Text>
                    <Text style={styles.metaText}>Seriennummer: {device.serialNumber}</Text>
                    <View style={{marginTop: 10}}>
                        {isSwitchDevice && <StatusPill label={currentOnState ? "Gerät ist an" : "Gerät ist aus"} tone={currentOnState ? "success" : "neutral"}/>}
                        {isHeating && <StatusPill label={`Zieltemperatur ${setpoint.toFixed(1)} °C`} tone="primary"/>}
                        {isWindow && <StatusPill label={isOpen ? "Fenster offen" : "Fenster geschlossen"} tone={isOpen ? "warning" : "success"}/>}
                        {isSmoke && <StatusPill label={smokeDetected ? "Rauch erkannt" : "Kein Rauch"} tone={smokeDetected ? "warning" : "success"}/>}
                    </View>
                </SurfaceCard>

                {(isSwitchDevice || isHeating || isSmoke) && (
                    <>
                        <SectionHeader title="Steuerung"/>
                        <SurfaceCard style={{marginBottom: 14}}>
                            {isSwitchDevice && (
                                <ActionButton
                                    title={currentOnState ? "Ausschalten" : "Einschalten"}
                                    onPress={() => {
                                        const next = !currentOnState;
                                        setLocalOnState(next);
                                        void runAction(onStateCapability?.id, {onState: {type: "Constant", value: next}});
                                    }}
                                    disabled={isSaving}
                                />
                            )}
                            {isSmoke && (
                                <ActionButton
                                    title={currentOnState ? "Sirene deaktivieren" : "Sirene aktivieren"}
                                    onPress={() => {
                                        const next = !currentOnState;
                                        setLocalOnState(next);
                                        void runAction(onStateCapability?.id, {onState: {type: "Constant", value: next}});
                                    }}
                                    variant="ghost"
                                    disabled={isSaving}
                                />
                            )}
                            {isHeating && (
                                <View style={styles.tempRow}>
                                    <ActionButton
                                        title="-0.5 °C"
                                        onPress={() => {
                                            const next = Math.max(5, Number((setpoint - 0.5).toFixed(1)));
                                            setLocalSetpoint(next);
                                            void runAction(setpointCapability?.id, {setpointTemperature: {type: "Constant", value: next}});
                                        }}
                                        variant="ghost"
                                        disabled={isSaving}
                                    />
                                    <View style={{height: 8}}/>
                                    <ActionButton
                                        title="+0.5 °C"
                                        onPress={() => {
                                            const next = Math.min(30, Number((setpoint + 0.5).toFixed(1)));
                                            setLocalSetpoint(next);
                                            void runAction(setpointCapability?.id, {setpointTemperature: {type: "Constant", value: next}});
                                        }}
                                        variant="ghost"
                                        disabled={isSaving}
                                    />
                                </View>
                            )}
                        </SurfaceCard>
                    </>
                )}

                <SectionHeader title="Messwerte"/>
                <SurfaceCard style={{marginBottom: 14}}>
                    <Text style={styles.metricLine}>Raumtemperatur: {currentTemp?.toFixed(1) ?? "-"} °C</Text>
                    <Text style={styles.metricLine}>Luftfeuchte: {currentHumidity?.toFixed(0) ?? "-"} %</Text>
                    <Text style={styles.metricLine}>Zieltemperatur: {setpoint.toFixed(1)} °C</Text>
                </SurfaceCard>

                <SectionHeader title="Capabilities"/>
                <SurfaceCard>
                    {capabilityEntries.length === 0 && <Text>Keine Capability-Daten verfügbar.</Text>}
                    {capabilityEntries.map((capability, index) => (
                        <View
                            key={capability.id}
                            style={{
                                borderBottomWidth: index < capabilityEntries.length - 1 ? 1 : 0,
                                borderBottomColor: "#e7edf3",
                                paddingVertical: 10
                            }}
                        >
                            <Text style={styles.capabilityTitle}>{capability.id}</Text>
                            {Object.entries(capability.state ?? {}).map(([key, value]) => (
                                <Text key={key} style={styles.capabilityValue}>
                                    {key}: {String(value.value)}
                                </Text>
                            ))}
                        </View>
                    ))}
                </SurfaceCard>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    metaText: {
        color: "#102a43",
        marginBottom: 4
    },
    tempRow: {
        marginTop: 8
    },
    metricLine: {
        color: "#102a43",
        marginBottom: 8
    },
    capabilityTitle: {
        color: "#102a43",
        fontWeight: "700",
        marginBottom: 4
    },
    capabilityValue: {
        color: "#5f7388"
    }
});
