import {Text, View} from "react-native";
import {FC} from "react";

type ListItemInfoOutsideProps = {
    children?: React.ReactNode
}

export const ListItemInfoOutside: FC<ListItemInfoOutsideProps> = ({children})=>{
    return <View style={{position: 'relative', paddingTop: 10, paddingBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{color: 'rgba(235, 235, 245, .60)', paddingRight: 5, width: '80%', paddingLeft: 5}}>{children}</Text>
</View>
}