import {Image, StyleSheet, Platform, ScrollView, Text, View} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {useContentModel} from "@/store/store";
import {useMemo} from "react";
import {Device} from "@/models/Device";
import {TYPES, ZWISCHENSTECKER, ZWISCHENSTECKER_OUTDOOR} from "@/constants/FieldConstants";
import { List } from 'react-native-paper';
import i18n from "@/i18n/i18n";
import {DeviceDecider} from "@/components/DeviceDecider";
import {Colors} from "@/constants/Colors";
import {StatusBar} from "expo-status-bar";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListItem} from "@/components/ListItem";
import {ListSeparator} from "@/components/ListSeparator";
import {Href, router} from "expo-router";

export default function HomeScreen() {
    const allthings = useContentModel(state=>state.allThings)


    const mappedDevicesToType = useMemo(() => {
        if (!allthings?.devices) return undefined
        const map = new Map<string, Device[]>
        TYPES.forEach(type=>{
            if(type === ZWISCHENSTECKER_OUTDOOR) {
                return
            }
            map.set(type,[])
        })
        for (const devDevice of Object.entries(allthings?.devices!)) {
            if(devDevice[1].type! === ZWISCHENSTECKER_OUTDOOR) {
                map.get(ZWISCHENSTECKER)?.push(devDevice[1])
                continue
            }
            map.get(devDevice[1].type!)?.push(devDevice[1])
        }
        return map
    }, [allthings?.devices]);


    return (
        <View style={styles.stepContainer}>
            <StatusBar style="auto" />
            <ScrollView style={{backgroundColor: 'black'}} overScrollMode="never" indicatorStyle="white" contentContainerStyle={
                {
                    backgroundColor: 'black'
                }
            }>
            <ListItemIsland style={{marginTop: 20}}>
                {
                    mappedDevicesToType && [...mappedDevicesToType.entries()]
                        .filter(([k,v])=>v.length>0)
                        .map(([key, dev], i)=> {
                            return <>
                            {(i!=0 && i!=dev.length) && <ListSeparator key={key+"sep"}/>}
                                <ListItem title={i18n.t(key)+" ("+dev.length+")"} key={key} onClick={()=>{
                                    router.push({
                                        // @ts-ignore
                                        pathname: "/main/devices/(tabs)/devices/[deviceTypeList]",
                                        params: {
                                            deviceTypeList: key
                                        }
                                    })
                                }}  />
                            </>
                        })
                }
            </ListItemIsland>
            </ScrollView>
        </View>
);
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        backgroundColor: Colors.background,
        gap: 8,
        marginBottom: 8,
        height: '100%'
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
