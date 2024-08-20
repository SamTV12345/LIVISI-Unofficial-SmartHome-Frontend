import {ScrollView, View} from "react-native";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListItemInfo} from "@/components/ListItemInfo";
import {useContentModel} from "@/store/store";
import {useMemo} from "react";
import {ListItemInfoHeading} from "@/components/ListItemInfoHeading";

export default function () {
    const allthings = useContentModel(state=>state.allThings)
    const ethConnected = useMemo(()=>{
        return allthings?.status.network.ethCableAttached === true
    }, [allthings])

    return         <ScrollView overScrollMode="always" style={{marginTop: 20, display: 'flex', gap: 20, flexDirection: 'column'}}>
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