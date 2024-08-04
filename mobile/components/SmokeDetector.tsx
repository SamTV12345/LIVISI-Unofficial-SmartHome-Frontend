import {FC, useState} from "react";
import {CapabilityState} from "@/models/CapabilityState";
import {Device} from "@/models/Device";
import {useDebounce} from "@/utils/useDebounce";
import {ACTION_ENDPOINT} from "@/constants/FieldConstants";
import {useContentModel} from "@/store/store";
import {ThemedView} from "@/components/ThemedView";
import {OnOffDeviceLayout} from "@/components/Heatingdevice";
import {ThemedText} from "@/components/ThemedText";
import {Pressable, View} from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {Colors} from "@/constants/Colors";

type OnOffDeviceProps = {
    device: Device,
    showRoom: boolean
}

export const SmokeDetector:FC<OnOffDeviceProps> = ({
    device,
    showRoom
                                                   })=>{
    const baseURL = useContentModel(state=>state.baseURL)
    const [isAlarming, setAlarming] = useState<boolean>(() => {
        for (const dev of device.capabilityState!) {
            if (dev.state && dev.state.onState && dev.state.onState.value) {
                return true
            }
        }
        return false
    })
    const [isSmokeDetected] = useState<boolean>(() => {
        for (const dev of device.capabilityState!) {
            if (dev.state && dev.state.isSmokeAlarm && dev.state.isSmokeAlarm.value) {
                return true
            }
        }
        return false
    })
    const [alarmCap] = useState<CapabilityState|undefined>(() => {
        for (const dev of device.capabilityState!) {
            if (dev.state && dev.state.onState) {
                return dev
            }
        }
        return undefined
    })


    const constructSmokeDetectorPostModel = (newStatus: CapabilityState)=>{
        return {
            id: newStatus.id,
            target:"/capability/"+newStatus.id,
            namespace: device.product,
            type: "SetState",
            params:{
                onState:{
                    type:"Constant",
                    value:  isAlarming
                }
            }
        }
    }

    useDebounce(()=>{
        const switchModel = constructSmokeDetectorPostModel(device.capabilityState![0])
        console.log(switchModel)
        fetch(baseURL+ACTION_ENDPOINT,{
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(switchModel)
        })
            .then((e)=>e.text())
            .then(e=>console.log(e))
    },200,[isAlarming])

    return <View style={[OnOffDeviceLayout.box, {
        flexDirection: 'column',
        backgroundColor: Colors.background
    }]}>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: Colors.background
        }}>
        <ThemedText style={{alignSelf: 'center'}}>{device.config.name}</ThemedText>
        <View style={OnOffDeviceLayout.pusher}></View>
        <Pressable style={[OnOffDeviceLayout.button, isAlarming&&OnOffDeviceLayout.buttonActive]} onPress={()=>{
            setAlarming(!isAlarming)
        }}>
            {
                isAlarming? <MaterialCommunityIcons name="alarm-light" size={24} color="red" style={{
                    alignSelf: 'center',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                    }} />:
                    <MaterialCommunityIcons style={{
                        alignSelf: 'center',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }} name="alarm-light-off" size={24} color="white" />
            }
        </Pressable>
        </View>
        <View>
            {
                isSmokeDetected?
                    <ThemedText>Rauch erkannt</ThemedText>:
                    <ThemedText>Kein Rauch erkannt</ThemedText>
            }
        </View>
    </View>
}
