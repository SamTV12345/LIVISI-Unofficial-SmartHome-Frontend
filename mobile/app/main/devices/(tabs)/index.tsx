import {Image, StyleSheet, Platform, ScrollView, Text, View, Dimensions} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {useContentModel} from "@/store/store";
import {useMemo, useState} from "react";
import {Device} from "@/models/Device";
import {
    FENSTERKONTAKT,
    HEATING, RAUCHMELDER,
    TYPES,
    WANDSENDER,
    ZWISCHENSTECKER,
    ZWISCHENSTECKER_OUTDOOR
} from "@/constants/FieldConstants";
import { List } from 'react-native-paper';
import i18n from "@/i18n/i18n";
import {Colors} from "@/constants/Colors";
import {StatusBar} from "expo-status-bar";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListItem} from "@/components/ListItem";
import {ListSeparator} from "@/components/ListSeparator";
import {Href, router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {Chip} from "@/components/Chip";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import {DeviceDecider} from "@/components/DeviceDecider";

export default function HomeScreen() {
    const allthings = useContentModel(state=>state.allThings)
    const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<string>()

    const mappedDevicesToType = useMemo(() => {
        if (!allthings?.devices) return new Map<any, any>()
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


    const colorChecker = (key: string)=>{
        if (key === selectedDeviceTypes) {
            return "black"
        } else {
            return "white"
        }
    }

    const getIcon = (key: string)=>{
        if (key == WANDSENDER) {
            return <Feather name="send" color={colorChecker(key)} size={17} style={{marginTop: 3}} />
        } else if (key === ZWISCHENSTECKER||key === ZWISCHENSTECKER_OUTDOOR){
            return <FontAwesome name="plug" size={17} color={colorChecker(key)} style={{marginTop: 2}} />
        } else if (key === HEATING) {
            return <MaterialIcons name="heat-pump" size={20} color={colorChecker(key)} style={{marginTop: 1}} />
        } else if (key === FENSTERKONTAKT) {
            return <MaterialCommunityIcons name="window-open" color={colorChecker(key)} size={17} />
        } else if (key === RAUCHMELDER) {
            return <MaterialCommunityIcons name="smoke-detector" size={17} color={colorChecker(key)} />
        }
        return <View></View>
    }
    let width = Dimensions.get('window').width

    return (
        <SafeAreaView style={styles.stepContainer}>
            <StatusBar style="light" />
            <View>
                <Image style={{  width: width, position: 'absolute', top:0, left:0 }} source={require('../../../../assets/images/caucasus.jpg')} />
            </View>
            <ScrollView style={{}} overScrollMode="never" indicatorStyle="white">
                <ThemedText type="title" style={{marginLeft: 20}}>Mein Zuhause</ThemedText>
                <ListSeparator/>
                <View style={{display: 'flex', flexDirection: 'row', gap: 10, marginLeft: 20, flexWrap: "wrap", marginTop: 10}}>
                    {[...mappedDevicesToType.keys()].filter(key=>mappedDevicesToType.get(key).length>0).map(k=>{
                        return <Chip key={k} icon={getIcon(k)} text={i18n.t(k)} selected={selectedDeviceTypes == k} onClick={()=>setSelectedDeviceTypes(k)}/>
                    })}
                </View>


                <View style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20}}>
                    {
                        allthings?.locations&& Object.entries(allthings?.locations!).map(([_,location])=>{
                            return <ListItemIsland key={location.id}>
                                <View style={{display: 'flex', flexDirection: 'row', padding: 10}}>
                                    <ThemedText type="subtitle">{location.config.name}</ThemedText>
                                    <Entypo name="chevron-right" size={24} color="white" style={{alignSelf: 'center', display: 'flex'}} />
                                </View>
                                <View style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10}}>
                                    {
                                        location.devices?.filter(device=>{
                                            return TYPES.includes(allthings?.devices[device].type!)
                                        })                                    .map(device=>{
                                            return <DeviceDecider device={allthings?.devices[device]!} key={device}/>
                                        })
                                    }
                                </View>
                            </ListItemIsland>
                        })
                    }
                </View>
            </ScrollView>
        </SafeAreaView>
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
