import {StyleSheet, View} from "react-native"
import {FC, PropsWithChildren} from "react";



export const ListItemIsland:FC<PropsWithChildren> = ({children})=>{

    return <View style={styles.container}>
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
