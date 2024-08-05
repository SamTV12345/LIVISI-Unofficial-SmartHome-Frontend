import {useLocalSearchParams, useNavigation} from "expo-router";
import {View, Text} from "react-native";
import {useContentModel} from "@/store/store";
import {useEffect, useMemo} from "react";
import {DeviceDecider} from "@/components/DeviceDecider";
import {SafeAreaView} from "react-native-safe-area-context";
import i18n from "@/i18n/i18n";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListSeparator} from "@/components/ListSeparator";

export default function() {
    const navigation = useNavigation()
    const { deviceTypeList } = useLocalSearchParams() as Record<string, string>
    const allthings = useContentModel(state=>state.allThings)

    const devicesOfType = useMemo(()=>{
        return Object.entries(allthings?.devices!).filter(d=>{
            return d[1].type === deviceTypeList
        }).map(e=>e[1])
    },[])


    useEffect(() => {
        navigation.setOptions({
            headerStyle: false,
            title: i18n.t(deviceTypeList)
        })
    }, [navigation]);


    return <SafeAreaView><ListItemIsland>
        {
            devicesOfType.map((d,i)=>{
                return <>
                    {(i!=0 && i!=devicesOfType.length) && <ListSeparator key={d.id+"sep"}/>}
                    <DeviceDecider device={d} key={d.id}/>
                </>
            })
        }
    </ListItemIsland></SafeAreaView>
}