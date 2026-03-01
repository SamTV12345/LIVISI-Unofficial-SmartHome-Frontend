import {useMemo, useState} from "react";
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useContentModel} from "@/store/store";
import {Device} from "@/models/Device";
import {LocationResponse} from "@/models/Location";
import {DeviceDecider} from "@/components/DeviceDecider";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {StatusPill} from "@/components/ui/StatusPill";
import {Colors} from "@/constants/Colors";
import {TYPES, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";
import i18n from "@/i18n/i18n";

type RoomGroup = {
    id: string;
    name: string;
    devices: Device[];
};

const compareByName = (a: string, b: string) =>
    a.localeCompare(b, "de", {sensitivity: "base"});

const normalizeType = (type: string) => type === ZWISCHENSTECKER_OUTDOOR ? ZWISCHENSTECKER : type;

const getDeviceName = (device: Device) =>
    device.config?.name || device.config?.friendlyName || device.id;

export default function HomeScreen() {
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

    const locationMap = useMemo(() => {
        const map = new Map<string, LocationResponse>();
        for (const location of allThings?.locations ?? []) {
            map.set(location.id, location);
        }
        return map;
    }, [allThings?.locations]);

    const groupedRooms = useMemo<RoomGroup[]>(() => {
        if (!allThings?.devices) {
            return [];
        }
        const rooms = new Map<string, RoomGroup>();
        const devices = Object.values(allThings.devices);

        for (const device of devices) {
            const normalizedType = normalizeType(device.type);
            if (!TYPES.includes(device.type) && !TYPES.includes(normalizedType)) {
                continue;
            }
            if (selectedType && normalizedType !== selectedType) {
                continue;
            }

            const location = locationMap.get(device.location);
            const roomId = location?.id ?? "unassigned";
            const roomName = location?.config.name ?? "Ohne Raum";
            const existing = rooms.get(roomId);
            const nextDevice: Device = {
                ...device,
                locationData: location
            };

            if (existing) {
                existing.devices.push(nextDevice);
            } else {
                rooms.set(roomId, {
                    id: roomId,
                    name: roomName,
                    devices: [nextDevice]
                });
            }
        }

        return [...rooms.values()]
            .map((room) => ({
                ...room,
                devices: room.devices.sort((a, b) => compareByName(getDeviceName(a), getDeviceName(b)))
            }))
            .sort((a, b) => compareByName(a.name, b.name));
    }, [allThings?.devices, locationMap, selectedType]);

    const typeCounts = useMemo(() => {
        const map = new Map<string, number>();
        for (const device of Object.values(allThings?.devices ?? {})) {
            const type = normalizeType(device.type);
            if (!TYPES.includes(type)) {
                continue;
            }
            map.set(type, (map.get(type) ?? 0) + 1);
        }
        return [...map.entries()].sort((a, b) => compareByName(i18n.t(a[0]), i18n.t(b[0])));
    }, [allThings?.devices]);

    const toggleRoom = (roomId: string) => {
        setExpandedRooms((current) => ({
            ...current,
            [roomId]: !current[roomId]
        }));
    };

    const totalDevices = Object.keys(allThings?.devices ?? {}).length;
    const roomCount = groupedRooms.length;

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title="SmartHome Uebersicht"
                    subtitle="Filtere Geraetetypen und steuere Geraete direkt pro Raum."
                    badges={[
                        {
                            label: `${totalDevices} Geraete`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="home-outline"/>
                        },
                        {
                            label: `${roomCount} Raeume`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="map-marker-outline"/>
                        },
                        {
                            label: `${typeCounts.length} Typen`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="view-grid-outline"/>
                        }
                    ]}
                    stats={[
                        {label: "Geraete", value: totalDevices},
                        {label: "Raeume", value: roomCount},
                        {label: "Typen", value: typeCounts.length},
                        {label: "Filter", value: selectedType ? i18n.t(selectedType) : "Alle"}
                    ]}
                />

                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}

                <ModernSection
                    title="Filter"
                    description="Nach Geraetetyp filtern"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="filter-variant"/>}
                    style={{marginBottom: 14}}
                >
                    <View style={styles.chipWrap}>
                        {typeCounts.map(([type, count]) => {
                            const selected = selectedType === type;
                            return (
                                <Pressable
                                    key={type}
                                    onPress={() => setSelectedType(selected ? undefined : type)}
                                    style={[styles.chip, selected ? styles.chipSelected : null]}
                                >
                                    <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                                        {i18n.t(type)} ({count})
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </ModernSection>

                {groupedRooms.length === 0 && (
                    <ModernSection
                        title="Raeume"
                        description="Keine Geraete fuer den aktuellen Filter"
                        icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="home-city-outline"/>}
                    >
                        <Text style={{color: Colors.app.textMuted}}>Keine Geräte für den aktuellen Filter gefunden.</Text>
                    </ModernSection>
                )}

                {groupedRooms.length > 0 && (
                    <ModernSection
                        title="Raeume"
                        description="Aufklappen fuer direkte Steuerung"
                        icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="home-city-outline"/>}
                        style={{marginBottom: 14}}
                    >
                        {groupedRooms.map((room, index) => {
                            const isExpanded = expandedRooms[room.id] ?? true;
                            return (
                                <View key={room.id} style={[styles.roomCard, index < groupedRooms.length - 1 ? styles.roomCardGap : null]}>
                                    <Pressable onPress={() => toggleRoom(room.id)} style={styles.roomHeader}>
                                        <View>
                                            <Text style={styles.roomName}>{room.name}</Text>
                                            <Text style={styles.roomMeta}>{room.devices.length} Geraete</Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={22}
                                            color={Colors.app.textMuted}
                                        />
                                    </Pressable>
                                    {isExpanded && (
                                        <View style={{marginTop: 10}}>
                                            {room.devices.map((device) => (
                                                <DeviceDecider key={device.id} device={device}/>
                                            ))}
                                        </View>
                                    )}
                                    {!isExpanded && <StatusPill label="Eingeklappt" tone="neutral"/>}
                                </View>
                            );
                        })}
                    </ModernSection>
                )}
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    chip: {
        backgroundColor: Colors.app.surfaceSoft,
        borderColor: Colors.app.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7
    },
    chipSelected: {
        backgroundColor: Colors.app.primarySoft,
        borderColor: Colors.app.primary
    },
    chipText: {
        color: Colors.app.textMuted,
        fontWeight: "600"
    },
    chipTextSelected: {
        color: Colors.app.primary
    },
    roomHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    roomCard: {
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 14,
        backgroundColor: Colors.app.surfaceSoft,
        padding: 11
    },
    roomCardGap: {
        marginBottom: 10
    },
    roomName: {
        color: Colors.app.text,
        fontSize: 19,
        fontWeight: "700"
    },
    roomMeta: {
        color: Colors.app.textMuted,
        marginTop: 2
    }
});
