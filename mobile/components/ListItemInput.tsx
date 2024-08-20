import {ScrollView, Text, TextInput, View} from "react-native";
import {FC, useState} from 'react'

type ListItemInputProps = {
    title: string,
    value: string,
    onChange:  ((text: string) => void),
    secureTextEntry?: boolean
    autoCorrect?: boolean
}

export const ListItemInput: FC<ListItemInputProps> = ({title, onChange, value, secureTextEntry, autoCorrect})=>{
    console.log(title, secureTextEntry)
    const [hide, setHide] = useState<boolean>(()=>secureTextEntry!==undefined?secureTextEntry: false)

    return <View style={{position: 'relative', paddingTop: 10, paddingBottom: 10, display: 'flex', flexDirection: 'row'}}>
        <Text style={[{marginLeft: 10, color: 'white', marginTop: 3}]}>{title}</Text>
        <Text style={{flexGrow: 1}}></Text>
        <ScrollView>
            <TextInput onFocus={()=>{
                if(secureTextEntry) {
                    setHide(false)
                }
            }} onBlur={()=>{
                setHide(true)
            }} secureTextEntry={hide} autoCorrect={autoCorrect} style={{color: 'rgba(235, 235, 245, .60)',
                paddingRight: 10, marginLeft: 10, textAlign: 'right'}} placeholder="test" value={value} onChangeText={(t)=>{
                onChange(t)
            }} />
        </ScrollView>
    </View>
}