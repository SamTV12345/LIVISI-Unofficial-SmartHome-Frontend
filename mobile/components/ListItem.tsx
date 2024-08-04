import {View, Text, Button, Pressable} from "react-native"
import {Colors} from "@/constants/Colors";
import {FC} from "react";
import {ThemedText} from "@/components/ThemedText";
import {Href, router} from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';


type ListItemProps = {
    title: string,
    to?:  Href<string | object>,
    type?: 'action',
    onClick?: ()=>void
}

export const ListItem: FC<ListItemProps> = ({title, to, type, onClick})=>{
    return <View style={{position: 'relative', paddingTop: 10, paddingBottom: 10}}>
        <Pressable style={[{display: 'flex', flexDirection: 'row'}]} onPress={()=>{
            to && router.replace(to)
            onClick && onClick()
        }}>
            <Text style={[{marginLeft: 20, color: 'white', fontSize: 17, lineHeight: 22},
                type == 'action' && {
                color: '#0385FF'
                }]}>{title}</Text>
            <Text style={{flexGrow: 1}}></Text>
            {!type&&<AntDesign name="right" size={12} color="#C7C7CC" style={{top: '25%', position: 'absolute', right: '5%'}} />}
        </Pressable>
    </View>
}
