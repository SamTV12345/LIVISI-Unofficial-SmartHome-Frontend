import {Text, View} from "react-native";
import {Device} from "@/models/Device";
import {FC, useMemo} from "react";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {ThemedText} from "@/components/ThemedText";
import {ThemedView} from "@/components/ThemedView";
import {OnOffDeviceLayout} from "@/components/Heatingdevice";

type OnOffDeviceProps = {
    device: Device,
    showRoom: boolean
}

export const  WindowContactDevice:FC<OnOffDeviceProps> =  ({device,showRoom})=> {
    const isOpen = useMemo(() => {
        for (const dev of device.capabilityState!){
            if (dev.state && dev.state.isOpen && dev.state.isOpen.value){
                return true
            }
        }
        return false
    }, [device.capabilityState])

    return <ThemedView style={[OnOffDeviceLayout.box, {
         flexDirection: 'column',
    }]}>
        <View style={{flexDirection: 'row', gap: 30}}>
        {
            isOpen?
                <MaterialCommunityIcons name="window-open" size={24} color="white" />:
                <MaterialCommunityIcons name="window-closed" size={24} color="white" />
        }
        <ThemedText>{device.config.name}</ThemedText>
        </View>
        <View >
            {
                isOpen?
                    <Text style={{color: 'white'}}>Geöffnet</Text>:
                    <Text style={{color: 'white'}}>Geschlossen</Text>
            }
        </View>
    </ThemedView>
}
