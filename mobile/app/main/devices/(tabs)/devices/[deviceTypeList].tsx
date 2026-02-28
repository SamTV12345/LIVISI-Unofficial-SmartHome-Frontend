import {useLocalSearchParams, useNavigation} from "expo-router";
import {useEffect, useMemo} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import i18n from "@/i18n/i18n";
import {useContentModel} from "@/store/store";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListSeparator} from "@/components/ListSeparator";
import {DeviceDecider} from "@/components/DeviceDecider";
import {RefreshControl, ScrollView, Text, View} from "react-native";
import {Colors} from "@/constants/Colors";
import {Device} from "@/models/Device";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";

export default function DeviceTypeListScreen() {
    const navigation = useNavigation();
    const {deviceTypeList} = useLocalSearchParams<{ deviceTypeList: string }>();
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const devicesOfType = useMemo((): Device[] => {
        const allDevices = Object.values(allThings?.devices ?? {});
        if (!deviceTypeList) {
            return [];
        }
        return allDevices.filter((device) => device.type === deviceTypeList);
    }, [allThings?.devices, deviceTypeList]);

    useEffect(() => {
        navigation.setOptions({
            title: i18n.t(deviceTypeList ?? "")
        });
    }, [deviceTypeList, navigation]);

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: Colors.background}}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}
                <ListItemIsland style={{marginTop: 20}}>
                    {devicesOfType.length === 0 && <Text style={{color: "white", padding: 16}}>Keine Geräte gefunden.</Text>}
                    {devicesOfType.map((device, index) => (
                        <View key={device.id}>
                            {index > 0 && <ListSeparator/>}
                            <DeviceDecider device={device}/>
                        </View>
                    ))}
                </ListItemIsland>
            </ScrollView>
        </SafeAreaView>
    );
}
