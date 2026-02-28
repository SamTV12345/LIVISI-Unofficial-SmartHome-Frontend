import {useEffect, useMemo} from "react";
import {RefreshControl, ScrollView, Text} from "react-native";
import {useLocalSearchParams, useNavigation} from "expo-router";
import i18n from "@/i18n/i18n";
import {useContentModel} from "@/store/store";
import {Device} from "@/models/Device";
import {DeviceDecider} from "@/components/DeviceDecider";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {AppScreen} from "@/components/ui/AppScreen";
import {ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";

const getDeviceName = (device: Device) =>
    device.config?.name || device.config?.friendlyName || device.id;

const normalizeType = (type: string) => type === ZWISCHENSTECKER_OUTDOOR ? ZWISCHENSTECKER : type;

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
        return allDevices
            .filter((device) => normalizeType(device.type) === deviceTypeList)
            .sort((a, b) => getDeviceName(a).localeCompare(getDeviceName(b), "de", {sensitivity: "base"}));
    }, [allThings?.devices, deviceTypeList]);

    useEffect(() => {
        navigation.setOptions({
            title: i18n.t(deviceTypeList ?? "")
        });
    }, [deviceTypeList, navigation]);

    return (
        <AppScreen title={i18n.t(deviceTypeList ?? "")} subtitle={`${devicesOfType.length} Geräte`} scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}
                {devicesOfType.length === 0 && (
                    <Text style={{color: "#5f7388"}}>Keine Geräte gefunden.</Text>
                )}
                {devicesOfType.map((device) => (
                    <DeviceDecider key={device.id} device={device}/>
                ))}
            </ScrollView>
        </AppScreen>
    );
}
