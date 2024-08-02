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
            <ScrollView style={{backgroundColor: 'black'}} overScrollMode="never" indicatorStyle="white" contentContainerStyle={
                {
                    backgroundColor: 'black'
                }
            }>
            <List.AccordionGroup>
                {
                    mappedDevicesToType && [...mappedDevicesToType.entries()]
                        .filter(([k,v])=>v.length>0)
                        .map(([key, dev])=>{
                            return <List.Accordion title={i18n.t(key)} id={key} key={key+"list"} style={{backgroundColor: Colors.background,
                            borderBottomWidth: 1,
                                borderColor: Colors.borderColor
                            }} titleStyle={
                                {
                                    color: 'white'
                                }
                            }>
                                {
                                    dev!.map(device=>{
                                        return <DeviceDecider device={device} key={device.id+"decider"}/>
                                    })
                                }
                            </List.Accordion>
                        })
                }
            </List.AccordionGroup>
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
