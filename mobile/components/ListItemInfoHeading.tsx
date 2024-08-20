import {View, Text} from "react-native";
import {FC, PropsWithChildren} from "react";

export const ListItemInfoHeading: FC<PropsWithChildren> =  ({children})=> {
    return <View>
        <Text style={{color: '#8E8E93', fontSize: 13, marginLeft: 40, textTransform: 'uppercase', marginTop: 20}}>{children}</Text>
    </View>
}