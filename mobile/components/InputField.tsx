import {StyleSheet, TextInput, Text, View} from "react-native";
import {FC} from "react";
import {Colors} from "@/constants/Colors";

type InputFieldProps = {
    value: string,
    onChange: (value: string)=>void,
    placeholder: string,
    error?: string
}

export const InputField: FC<InputFieldProps>  = ({
    onChange,value,placeholder,
                                  error               })=>{
    return <View style={{width: '100%'}}>
        <TextInput placeholderTextColor="white" placeholder={placeholder} style={InputStyleSheet.input} value={value} onChangeText={(e)=>{
       onChange(e)
    }}/>
        {error&&<Text style={{color: 'red', marginLeft: 10}}>{error}</Text>}
    </View>
}


const InputStyleSheet = StyleSheet.create({
    input: {
        paddingLeft: 20,
        color: Colors.color.white,
        backgroundColor: Colors.accent,
        borderColor:Colors.color.white,
        height: 40,
        borderWidth: 1,
        padding: 10,
        borderRadius: 200,
        width: '100%'
    },
})
