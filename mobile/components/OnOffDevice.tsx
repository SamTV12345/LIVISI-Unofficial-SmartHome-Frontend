import {FC, useState} from "react";
import {Device} from "@/models/Device";
import {CapabilityState} from "@/models/CapabilityState";
import {View, Text, StyleSheet, Pressable, TouchableOpacity, Image, Modal, ImageBackground} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import AntDesign from '@expo/vector-icons/AntDesign';
import {ThemedView} from "@/components/ThemedView";
import {ACTION_ENDPOINT} from "@/constants/FieldConstants";
import {useDebounce} from "@/utils/useDebounce";
import {useContentModel} from "@/store/store";
import {Colors} from "@/constants/Colors";
import {CURRENT_TEMPERATURE, OnOffDeviceLayout} from "@/components/Heatingdevice";
import {TurnedOn} from "@/components/TurnedOn";
import {RadialSlider} from "react-native-radial-slider";
import {FontAwesome} from "@expo/vector-icons";
import {TurnedOnGlow} from "@/components/TurnedOnGlow";

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
    const [modalDeviceOpen, setModalDeviceOpen] = useState<boolean>(false)
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

    return <TouchableOpacity style={[OnOffDeviceLayout.box, turnedOn && OnOffDeviceLayout.boxSelected, !turnedOn &&OnOffDeviceLayout.boxNotSelected]} onPress={()=>{
        setModalDeviceOpen(true)
    }}>
        <View style={{position: 'relative', width: 35, height: 35, marginLeft: 10, marginTop: 5}}>
            {turnedOn? <TurnedOn style={{
            fill:'black',
            transform: [{scale: 0.5}, {rotate: '90deg'}]

        }}/> : <TurnedOn style={{
                fill: 'black',
                transform: [{scale: 0.5}, {rotate: '90deg'}]
            }}
                         onPress={()=>setTurnedOn(true)}
            />
            }
        </View>
        <Modal visible={modalDeviceOpen} transparent>
            <ImageBackground
                style={{flex: 1}}
                resizeMode="cover"
                source={require('../assets/images/caucasus.jpg')}
                blurRadius={10}
            >
                <TouchableOpacity style={{flex: 1}} onPress={()=>{
                    setModalDeviceOpen(false)
                }}>
                    <View style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
                        {turnedOn? <TurnedOnGlow style={{
                            fill:'black',
                            transform: [{scale: 0.5}, {rotate: '270deg'}]

                        }}
                        onPress={()=>setTurnedOn(false)}
                        /> : <TurnedOn style={{
                            fill: 'black',
                            transform: [{scale: 0.5}, {rotate: '90deg'}]
                        }}
                                        onPress={()=>setTurnedOn(true)}
                        />
                        }
                    </View>
                    <FontAwesome name={"cog"} size={24} style={{position: 'absolute', right: 10, top: 10}}/>


                </TouchableOpacity>

            </ImageBackground>
        </Modal>
        <ThemedText style={[OnOffDeviceLayout.boxSelected, OnOffDeviceLayout.boxText, !turnedOn&& OnOffDeviceLayout.boxNotSelected, {
            fontSize: 12
        }]}>
            {device.config.name}
        </ThemedText>
    </TouchableOpacity>
}
