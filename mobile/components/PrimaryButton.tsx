import {Pressable, StyleSheet, Text} from "react-native";
import {Colors} from "@/constants/Colors";
import {FC} from "react";

type PrimaryButtonProps = {
    title: string,
    onClick: ()=>void
}

export const PrimaryButton: FC<PrimaryButtonProps> = ({
    onClick,
    title
                                                      })=>{
    return  <Pressable style={styles.button} onPress={onClick}>
        <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
}


const styles = StyleSheet.create({
    button: {
        borderRadius: 200,
        alignItems: 'center',
        backgroundColor: Colors.color.green,
    },
    buttonText: {
        padding: 7,
        color: Colors.color.white
    }
})