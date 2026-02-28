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
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {SectionHeader} from "@/components/ui/SectionHeader";
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

    return (
        <AppScreen
            title="Zuhause"
            subtitle={`${Object.keys(allThings?.devices ?? {}).length} Geräte`}
            scroll={false}
        >
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}

                <SectionHeader title="Filter"/>
                <SurfaceCard style={{marginBottom: 14}}>
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
                </SurfaceCard>

                <SectionHeader title="Räume" subtitle="Aufklappen für Gerätesteuerung"/>
                {groupedRooms.length === 0 && (
                    <SurfaceCard>
                        <Text style={{color: Colors.app.textMuted}}>Keine Geräte für den aktuellen Filter gefunden.</Text>
                    </SurfaceCard>
                )}

                {groupedRooms.map((room) => {
                    const isExpanded = expandedRooms[room.id] ?? true;
                    return (
                        <SurfaceCard key={room.id} style={{marginBottom: 12}}>
                            <Pressable onPress={() => toggleRoom(room.id)} style={styles.roomHeader}>
                                <View>
                                    <Text style={styles.roomName}>{room.name}</Text>
                                    <Text style={styles.roomMeta}>{room.devices.length} Geräte</Text>
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
                        </SurfaceCard>
                    );
                })}
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
