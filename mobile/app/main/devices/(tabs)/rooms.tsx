import {SafeAreaView} from "react-native-safe-area-context";
import {RefreshControl, ScrollView, Text, View} from "react-native";
import {useMemo} from "react";
import {useContentModel} from "@/store/store";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListItem} from "@/components/ListItem";
import {ListSeparator} from "@/components/ListSeparator";
import i18n from "@/i18n/i18n";
import {TYPES, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";
import {Colors} from "@/constants/Colors";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";

export default function RoomsTabScreen() {
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const deviceTypeCounts = useMemo(() => {
        const countMap = new Map<string, number>();
        const devices = Object.values(allThings?.devices ?? {});

        for (const device of devices) {
            if (!TYPES.includes(device.type)) {
                continue;
            }

            const normalizedType = device.type === ZWISCHENSTECKER_OUTDOOR ? ZWISCHENSTECKER : device.type;
            const currentCount = countMap.get(normalizedType) ?? 0;
            countMap.set(normalizedType, currentCount + 1);
        }

        return [...countMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [allThings?.devices]);

    if (!allThings) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: Colors.background}}>
                <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                    <Text style={{color: "white"}}>Lade Gerätedaten...</Text>
                    {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                        void refreshAllThings();
                    }}/>}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: Colors.background}}>
            <ScrollView
                style={{paddingTop: 20}}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}
                <ListItemIsland>
                    {deviceTypeCounts.length === 0 && <ListItem title="Keine Geräte gefunden"/>}
                    {deviceTypeCounts.map(([type, count], index) => (
                        <View key={type}>
                            {index > 0 && <ListSeparator/>}
                            <ListItem
                                title={`${i18n.t(type)} (${count})`}
                                to={{
                                    pathname: "/main/devices/(tabs)/devices/[deviceTypeList]",
                                    params: {deviceTypeList: type}
                                }}
                            />
                        </View>
                    ))}
                </ListItemIsland>
            </ScrollView>
        </SafeAreaView>
    );
}
