import {View, Text, Button, Pressable} from "react-native"
import {Colors} from "@/constants/Colors";
import {FC} from "react";
import {ThemedText} from "@/components/ThemedText";
import {router} from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';


type ListItemProps = {
    title: string,
    to?: string
}

export const ListItem: FC<ListItemProps> = ({title, to})=>{
    return <View style={{borderColor: Colors.borderColor, paddingLeft: 20, paddingTop: 10,paddingRight: 20, paddingBottom: 10, borderBottomWidth: 1}}>
        <Pressable style={{display: 'flex', flexDirection: 'row'}} onPress={()=>{
            to && router.replace(to)
        }}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <Text style={{flexGrow: 1}}></Text>
            <AntDesign name="right" size={24} color="white" />
        </Pressable>
    </View>
}