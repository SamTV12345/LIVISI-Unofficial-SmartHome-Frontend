import {RefreshControl, ScrollView, View} from "react-native";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListItemInfo} from "@/components/ListItemInfo";
import {useContentModel} from "@/store/store";
import {useMemo} from "react";
import {ListItemInfoHeading} from "@/components/ListItemInfoHeading";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";

export default function () {
    const allthings = useContentModel(state=>state.allThings)
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();
    const ethConnected = useMemo(()=>{
        return allthings?.status.network.ethCableAttached === true
    }, [allthings])

    if (!allthings) {
        return <ScrollView overScrollMode="always" style={{marginTop: 20}}>
            {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                void refreshAllThings();
            }}/>}
            <ListItemIsland>
                <ListItemInfo title="Status">Lade Netzwerkdaten...</ListItemInfo>
            </ListItemIsland>
        </ScrollView>
    }

    return         <ScrollView
        overScrollMode="always"
        style={{marginTop: 20, display: 'flex', gap: 20, flexDirection: 'column'}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            void refreshAllThings();
        }}/>}
    >
        {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
            void refreshAllThings();
        }}/>}
        <ListItemIsland>
            <ListItemInfo title="Verbunden über">{ethConnected? 'LAN': 'WLAN'}</ListItemInfo>
        </ListItemIsland>

        {
            ethConnected && <>
                <ListItemInfoHeading>IPv4-Adresse</ListItemInfoHeading>
                <ListItemIsland style={{marginTop: 5}}>
                    <ListItemInfo title={"IP-Adresse"}>{allthings?.status.network.ethIpAddress}</ListItemInfo>
                    <ListItemInfo title={"MAC"}>{allthings?.status.network.ethMacAddress}</ListItemInfo>
                </ListItemIsland>
            </>
        }

        {
            !ethConnected && <>
                <ListItemInfoHeading>IPv4-Adresse</ListItemInfoHeading>
                <ListItemIsland style={{marginTop: 5}}>
                    <ListItemInfo title={"IP-Adresse"}>{allthings?.status.network.wifiIpAddress}</ListItemInfo>
                    <ListItemInfo title={"MAC"}>{allthings?.status.network.wifiMacAddress}</ListItemInfo>
                </ListItemIsland>
            </>
        }

    </ScrollView>
    }
