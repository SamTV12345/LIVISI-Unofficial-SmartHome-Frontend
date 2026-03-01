import {FC, useMemo, useState} from "react";
import {Alert, Pressable, StyleSheet, Text, View} from "react-native";
import {Device} from "@/models/Device";
import {useContentModel} from "@/store/store";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {StatusPill} from "@/components/ui/StatusPill";
import {ActionButton} from "@/components/ui/ActionButton";
import {Colors} from "@/constants/Colors";
import {Href, router} from "expo-router";
import {FENSTERKONTAKT, HEATING, RAUCHMELDER, WANDSENDER, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";
import i18n from "@/i18n/i18n";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useGatewayApi} from "@/hooks/useGatewayApi";

type DeviceDeciderProps = {
    device: Device;
};

type CapabilityEntry = {
    id: string;
    state?: Record<string, {value: unknown}>;
};

const getCapabilityByField = (device: Device, key: string): CapabilityEntry | undefined => {
    return (device.capabilityState ?? []).find((entry) => entry.state && Object.prototype.hasOwnProperty.call(entry.state, key)) as CapabilityEntry | undefined;
};

const readBoolean = (entry: CapabilityEntry | undefined, key: string): boolean => {
    return Boolean(entry?.state?.[key]?.value);
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

const buildPayload = (
    device: Device,
    capabilityId: string,
    params: Record<string, {type: "Constant"; value: unknown}>
) => ({
    id: capabilityId,
    target: `/capability/${capabilityId}`,
    namespace: device.product || `core.${device.manufacturer}`,
    type: "SetState",
    params
});

const displayName = (device: Device): string => {
    return device.config?.name || device.config?.friendlyName || device.id;
};

export const DeviceDecider: FC<DeviceDeciderProps> = ({device}) => {
    const gateway = useContentModel((state) => state.gateway);
    const allThings = useContentModel((state) => state.allThings);
    const gatewayApi = useGatewayApi();
    const actionMutation = gatewayApi.useMutation("post", "/action");
    const [isSaving, setIsSaving] = useState(false);
    const [localOnState, setLocalOnState] = useState<boolean | undefined>(undefined);
    const [localSetpoint, setLocalSetpoint] = useState<number | undefined>(undefined);

    const onStateCapability = useMemo(() => getCapabilityByField(device, "onState"), [device]);
    const windowStateCapability = useMemo(() => getCapabilityByField(device, "isOpen"), [device]);
    const smokeStateCapability = useMemo(() => getCapabilityByField(device, "isSmokeAlarm"), [device]);
    const temperatureCapability = useMemo(() => getCapabilityByField(device, "temperature"), [device]);
    const humidityCapability = useMemo(() => getCapabilityByField(device, "humidity"), [device]);
    const setpointCapability = useMemo(() => getCapabilityByField(device, "setpointTemperature"), [device]);

    const roomName = useMemo(() => {
        if (device.locationData?.config?.name) {
            return device.locationData.config.name;
        }
        const location = allThings?.locations.find((entry) => entry.id === device.location);
        return location?.config.name;
    }, [allThings?.locations, device.location, device.locationData?.config?.name]);

    const currentOnState = localOnState ?? readBoolean(onStateCapability, "onState");
    const currentSetpoint = localSetpoint ?? readNumber(setpointCapability, "setpointTemperature") ?? 20;
    const currentTemperature = readNumber(temperatureCapability, "temperature");
    const currentHumidity = readNumber(humidityCapability, "humidity");
    const isOpen = readBoolean(windowStateCapability, "isOpen");
    const isSmokeDetected = readBoolean(smokeStateCapability, "isSmokeAlarm");
    const isSwitchDevice = device.type === ZWISCHENSTECKER || device.type === ZWISCHENSTECKER_OUTDOOR;
    const isHeating = device.type === HEATING;
    const isSmokeDetector = device.type === RAUCHMELDER;
    const isWallSwitch = device.type === WANDSENDER;
    const isWindowContact = device.type === FENSTERKONTAKT;

    const saveAction = async (
        capabilityId: string | undefined,
        params: Record<string, {type: "Constant"; value: unknown}>
    ) => {
        if (!gateway?.baseURL || !capabilityId || isSaving) {
            return;
        }
        setIsSaving(true);
        try {
            await actionMutation.mutateAsync({
                body: buildPayload(device, capabilityId, params)
            });
        } catch {
            Alert.alert("Aktion fehlgeschlagen", "Das Gateway hat die Änderung nicht übernommen.");
        } finally {
            setIsSaving(false);
        }
    };

    const openDetail = () => {
        router.push({
            pathname: "/main/devices/device/[deviceId]",
            params: {deviceId: device.id}
        } as Href);
    };

    const statusPill = (() => {
        if (isSwitchDevice) {
            return <StatusPill label={currentOnState ? "An" : "Aus"} tone={currentOnState ? "success" : "neutral"}/>;
        }
        if (isHeating) {
            return <StatusPill label={`Ziel ${currentSetpoint.toFixed(1)} °C`} tone="primary"/>;
        }
        if (isWindowContact) {
            return <StatusPill label={isOpen ? "Geöffnet" : "Geschlossen"} tone={isOpen ? "warning" : "success"}/>;
        }
        if (isSmokeDetector) {
            return <StatusPill label={isSmokeDetected ? "Rauch erkannt" : "Kein Alarm"} tone={isSmokeDetected ? "warning" : "success"}/>;
        }
        return <StatusPill label="Bereit" tone="neutral"/>;
    })();

    return (
        <SurfaceCard style={styles.card}>
            <View style={{gap: 10}}>
                <View style={styles.headerRow}>
                    <View style={{flexShrink: 1}}>
                        <Text style={styles.deviceName}>{displayName(device)}</Text>
                        <Text style={styles.deviceMeta}>{i18n.t(device.type) || device.type}{roomName ? ` · ${roomName}` : ""}</Text>
                    </View>
                    {statusPill}
                </View>

                {isHeating && (
                    <View style={styles.metricRow}>
                        <Text style={styles.metricValue}>{currentTemperature?.toFixed(1) ?? "-"} °C</Text>
                        <Text style={styles.metricLabel}>Raumtemperatur</Text>
                        <Text style={styles.metricValue}>{currentHumidity?.toFixed(0) ?? "-"} %</Text>
                        <Text style={styles.metricLabel}>Luftfeuchte</Text>
                    </View>
                )}

                {isWallSwitch && (
                    <View style={styles.iconRow}>
                        <MaterialCommunityIcons name="light-switch" size={22} color={Colors.app.primary}/>
                        <Text style={styles.mutedText}>Wandsender erkannt</Text>
                    </View>
                )}

                <View style={styles.actionsRow}>
                    {isSwitchDevice && (
                        <ActionButton
                            title={currentOnState ? "Ausschalten" : "Einschalten"}
                            onPress={() => {
                                const next = !currentOnState;
                                setLocalOnState(next);
                                void saveAction(onStateCapability?.id, {
                                    onState: {type: "Constant", value: next}
                                });
                            }}
                            disabled={isSaving}
                        />
                    )}
                    {isSmokeDetector && (
                        <ActionButton
                            title={currentOnState ? "Sirene aus" : "Sirene an"}
                            onPress={() => {
                                const next = !currentOnState;
                                setLocalOnState(next);
                                void saveAction(onStateCapability?.id, {
                                    onState: {type: "Constant", value: next}
                                });
                            }}
                            variant="ghost"
                            disabled={isSaving}
                        />
                    )}
                    {isHeating && (
                        <View style={styles.heatingControlRow}>
                            <Pressable
                                style={styles.stepButton}
                                disabled={isSaving}
                                onPress={() => {
                                    const next = Math.max(5, Number((currentSetpoint - 0.5).toFixed(1)));
                                    setLocalSetpoint(next);
                                    void saveAction(setpointCapability?.id, {
                                        setpointTemperature: {type: "Constant", value: next}
                                    });
                                }}
                            >
                                <Text style={styles.stepButtonLabel}>-</Text>
                            </Pressable>
                            <Text style={styles.stepValue}>{currentSetpoint.toFixed(1)} °C</Text>
                            <Pressable
                                style={styles.stepButton}
                                disabled={isSaving}
                                onPress={() => {
                                    const next = Math.min(30, Number((currentSetpoint + 0.5).toFixed(1)));
                                    setLocalSetpoint(next);
                                    void saveAction(setpointCapability?.id, {
                                        setpointTemperature: {type: "Constant", value: next}
                                    });
                                }}
                            >
                                <Text style={styles.stepButtonLabel}>+</Text>
                            </Pressable>
                        </View>
                    )}
                    {!isHeating && !isSwitchDevice && !isSmokeDetector && (
                        <ActionButton title="Details öffnen" onPress={openDetail} variant="ghost"/>
                    )}
                    {(isHeating || isSwitchDevice || isSmokeDetector) && (
                        <View style={{marginTop: 8}}>
                            <ActionButton title="Details" onPress={openDetail} variant="ghost"/>
                        </View>
                    )}
                </View>
            </View>
        </SurfaceCard>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10
    },
    deviceName: {
        color: Colors.app.text,
        fontSize: 18,
        fontWeight: "700"
    },
    deviceMeta: {
        color: Colors.app.textMuted,
        marginTop: 2
    },
    metricRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: 8,
        rowGap: 4
    },
    metricValue: {
        color: Colors.app.text,
        fontSize: 16,
        fontWeight: "700"
    },
    metricLabel: {
        color: Colors.app.textMuted
    },
    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    mutedText: {
        color: Colors.app.textMuted
    },
    actionsRow: {
        marginTop: 4
    },
    heatingControlRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.app.surfaceSoft,
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8
    },
    stepButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.app.primarySoft
    },
    stepButtonLabel: {
        color: Colors.app.primary,
        fontSize: 22,
        fontWeight: "700",
        marginTop: -2
    },
    stepValue: {
        color: Colors.app.text,
        fontWeight: "700",
        fontSize: 16
    }
});
