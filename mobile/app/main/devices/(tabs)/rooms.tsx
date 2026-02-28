import {RefreshControl, ScrollView, Text, View} from "react-native";
import {useMemo} from "react";
import {router} from "expo-router";
import {useContentModel} from "@/store/store";
import {TYPES, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";
import i18n from "@/i18n/i18n";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {SurfaceCard} from "@/components/ui/SurfaceCard";
import {NavRow} from "@/components/ui/NavRow";

const normalizeType = (type: string) => type === ZWISCHENSTECKER_OUTDOOR ? ZWISCHENSTECKER : type;

export default function RoomsTabScreen() {
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const deviceTypeCounts = useMemo(() => {
        const countMap = new Map<string, number>();
        const devices = Object.values(allThings?.devices ?? {});

        for (const device of devices) {
            const normalized = normalizeType(device.type);
            if (!TYPES.includes(normalized)) {
                continue;
            }
            countMap.set(normalized, (countMap.get(normalized) ?? 0) + 1);
        }

        return [...countMap.entries()]
            .sort((a, b) => i18n.t(a[0]).localeCompare(i18n.t(b[0]), "de", {sensitivity: "base"}));
    }, [allThings?.devices]);

    return (
        <AppScreen title="Gerätetypen" subtitle="Alphabetisch sortiert" scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}

                <SectionHeader title="Typenübersicht"/>
                <SurfaceCard>
                    {deviceTypeCounts.length === 0 && (
                        <Text style={{color: "#5f7388"}}>Keine Geräte gefunden.</Text>
                    )}
                    {deviceTypeCounts.map(([type, count], index) => (
                        <View
                            key={type}
                            style={{
                                borderBottomWidth: index < deviceTypeCounts.length - 1 ? 1 : 0,
                                borderBottomColor: "#e7edf3"
                            }}
                        >
                            <NavRow
                                title={i18n.t(type)}
                                subtitle={`${count} Gerät${count > 1 ? "e" : ""}`}
                                onPress={() => {
                                    router.push({
                                        pathname: "/main/devices/(tabs)/devices/[deviceTypeList]",
                                        params: {deviceTypeList: type}
                                    });
                                }}
                            />
                        </View>
                    ))}
                </SurfaceCard>
            </ScrollView>
        </AppScreen>
    );
}
