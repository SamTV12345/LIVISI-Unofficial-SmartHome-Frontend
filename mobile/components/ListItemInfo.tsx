import {View, Text, Button, Pressable} from "react-native"
import {FC} from "react";


type ListItemProps = {
    title: string,
    children?: React.ReactNode
}

export const ListItemInfo: FC<ListItemProps> = ({title, children})=>{
    return <View style={{position: 'relative', paddingTop: 10, paddingBottom: 10, display: 'flex', flexDirection: 'row'}}>
            <Text style={[{marginLeft: 10, color: 'white', fontSize: 17, lineHeight: 22}]}>{title}</Text>
            <Text style={{flexGrow: 1}}></Text>
            <Text style={{color: 'rgba(235, 235, 245, .60)', paddingRight: 10}}>{children}</Text>
    </View>
}