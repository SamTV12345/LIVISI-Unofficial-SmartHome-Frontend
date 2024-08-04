import {FC, useState} from "react";
import {Device} from "@/models/Device";
import {CapabilityState} from "@/models/CapabilityState";
import {View, Text, StyleSheet, Pressable} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import AntDesign from '@expo/vector-icons/AntDesign';
import {ThemedView} from "@/components/ThemedView";
import {ACTION_ENDPOINT} from "@/constants/FieldConstants";
import {useDebounce} from "@/utils/useDebounce";
import {useContentModel} from "@/store/store";
import {Colors} from "@/constants/Colors";
import {OnOffDeviceLayout} from "@/components/Heatingdevice";

type OnOffDeviceProps = {
    device: Device,
    showRoom: boolean
}

export const OnOffDevice:FC<OnOffDeviceProps> = ({device, showRoom})=>{
    const [turnedOn, setTurnedOn] = useState<boolean>(()=>{
        for (const dev of device.capabilityState!){
            if (dev.state.onState.value){
                return true
            }
        }
        return false
    })
    const baseURL = useContentModel(state=>state.baseURL)


    useDebounce(()=>{
        const switchModel = constructSwitchPostModel(device.capabilityState![0])
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
    },200,[turnedOn])

    const constructSwitchPostModel = (newStatus: CapabilityState)=>{
        return {
            id: newStatus.id,
            target:"/capability/"+newStatus.id,
            namespace: device.product,
            type: "SetState",
            params:{
                onState:{
                    type:"Constant",
                    value:  turnedOn
                }
            }
        }
    }

    return <View style={ [OnOffDeviceLayout.box, {paddingTop: 10, paddingBottom: 10}]}>
        <AntDesign name="switcher" style={{alignSelf: 'center', color: 'white'}} size={30} />
        <ThemedText style={{alignSelf: 'center', flexWrap: "wrap", flexShrink: 1}}>{device.config.name}</ThemedText>
        <View style={OnOffDeviceLayout.pusher}></View>
        <Pressable style={[OnOffDeviceLayout.button, turnedOn&&OnOffDeviceLayout.buttonActive]} onPress={()=>{
            setTurnedOn(!turnedOn)
        }}>
            <ThemedText style={[{textAlign: 'center'}, turnedOn&& {color: 'white'}]}>{turnedOn?'An':'Aus'}</ThemedText>
        </Pressable>
    </View>
}
