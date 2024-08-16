import {StyleProp, StyleSheet, View, ViewStyle, Text, Button, TouchableOpacity} from "react-native";
import {FC} from "react";

type ChipStyle = {
    style?:  StyleProp<ViewStyle>
    text: string,
    selected: boolean,
    onClick?: ()=>void,
    icon?: React.ReactNode
}

export const Chip:FC<ChipStyle> = ({style, text, selected, onClick, icon})=>{
    return <TouchableOpacity  style={[style, chipStyle.chip, selected&& chipStyle.chipSelected]} onPress={onClick}>
        <View style={{display: 'flex', flexDirection: 'row', gap: 5}}>
            {icon && icon}
        <Text style={[chipStyle.text, selected&& chipStyle.textSelected]}>{text}</Text>
        </View>
    </TouchableOpacity >
}


const chipStyle = StyleSheet.create({
    text: {
        color: 'white',
        fontSize: 16
    },
    chip:{
        backgroundColor: '#1C1C1E',
        padding: 10,
        borderRadius: 200,
    },
    chipSelected: {
        backgroundColor: 'white'
    },
    textSelected: {
        color: 'black'
    }
})