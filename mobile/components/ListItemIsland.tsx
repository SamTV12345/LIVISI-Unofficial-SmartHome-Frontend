import {StyleProp, StyleSheet, View, ViewStyle} from "react-native"
import {FC, PropsWithChildren} from "react";

type ListItemIslandProp = {
    children:any,
    style?:  StyleProp<ViewStyle>
}

export const ListItemIsland: FC<ListItemIslandProp> = ({children, style})=>{

    return <View style={[styles.container, style]}>
        {children}
    </View>
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        marginLeft: 30,
        marginRight: 30,
        borderRadius: 10,
        overflow: 'hidden',
    }
})
