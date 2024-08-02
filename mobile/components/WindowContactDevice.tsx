import {Pressable, StyleSheet, Text, View} from "react-native";
import {Device} from "@/models/Device";
import {FC, useState} from "react";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from "@expo/vector-icons/AntDesign";
import {ThemedText} from "@/components/ThemedText";
import {ThemedView} from "@/components/ThemedView";
import {Colors} from "@/constants/Colors";

type OnOffDeviceProps = {
    device: Device,
    showRoom: boolean
}

export const  WindowContactDevice:FC<OnOffDeviceProps> =  ({device,showRoom})=> {
    const [isOpen, _] = useState<boolean>(()=>{
        for (const dev of device.capabilityState!){
            if (dev.state && dev.state.isOpen && dev.state.isOpen.value){
                return true
            }
        }
        return false
    })

    return <ThemedView style={OnOffDeviceLayout.box}>
        <ThemedText style={{alignSelf: 'center'}}>{device.config.name}</ThemedText>
        <View style={OnOffDeviceLayout.pusher}></View>
        {
            isOpen?
                <MaterialCommunityIcons name="window-open" size={24} color="black" />:
                <MaterialCommunityIcons name="window-closed" size={24} color="black" />
        }
        <View >
            {
                isOpen?
                    <Text>Geöffnet</Text>:
                    <Text>Geschlossen</Text>
            }
        </View>
    </ThemedView>
}

const OnOffDeviceLayout = StyleSheet.create({
    box: {
        display: 'flex',
        flexDirection: 'row',
        padding: 20,
        gap: 20
    },

    pusher: {
        flexGrow: 1
    },
    button: {
        justifyContent: 'center',
        alignContent: 'center',
        borderColor: Colors.color.black,
        borderWidth: 1,
        borderRadius: 200,
        padding: 5,
        width: 50,
        height: 50
    },
    buttonActive: {
        backgroundColor: Colors.color.green
    }
})