import {Device} from "@/models/Device";
import {FC} from "react";
import {TouchableOpacity, Text} from "react-native";
import {OnOffDeviceLayout} from "@/components/Heatingdevice";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type OnOffDeviceProps = {
    device: Device,
    showRoom: boolean
}

export const WandSender:FC<OnOffDeviceProps> = ({device,showRoom})=>{
    return <TouchableOpacity style={[OnOffDeviceLayout.box, OnOffDeviceLayout.boxSelected ,{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    }]} onPress={()=>{

    }}>
        <MaterialCommunityIcons name="light-switch" size={24} color="black" />

        <Text style={{width: 50, flexWrap: 'wrap', fontWeight: 'bold', fontSize: 13}}>{device.config.name}</Text>
    </TouchableOpacity>
}
