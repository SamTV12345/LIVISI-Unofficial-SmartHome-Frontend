import {ThemedView} from "@/components/ThemedView";
import {ThemedText} from "@/components/ThemedText";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button, Pressable, StyleSheet, TextInput, Text} from "react-native";
import {useState} from "react";
import {Colors} from "@/constants/Colors";
import {PrimaryButton} from "@/components/PrimaryButton";
import {ConfigData} from "@/models/ConfigData";
import {updateServerConfig} from "@/utils/sqlite";
import {useContentModel} from "@/store/store";





export default function LoginScreen() {
    const baseURL = useContentModel(state=>state.baseURL)
    const setBaseURL = useContentModel(state=>state.setBaseURL)

    return <SafeAreaView>
        <ThemedView style={styles.view}>
        <ThemedView>
            <ThemedText style={{
                textAlign: 'center',
                fontSize: 20
            }}>
                Login zu Livisi Smarthome Unofficial
            </ThemedText>
            <TextInput style={styles.input} value={baseURL} onChangeText={(e)=>{
              setBaseURL(e.toLowerCase())
            }}/>
            <PrimaryButton  title="Login" onClick={()=>{

            }}/>
        </ThemedView>
    </ThemedView></SafeAreaView>
}

const styles = StyleSheet.create({
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 200
    },
    button:{
        borderRadius: 200,
        alignItems: 'center',
        backgroundColor: Colors.color.green,
        color: '#fff'
    },

    view: {
        justifyContent: 'center', //Centered vertically
        alignItems: 'center', //Centered horizontally
        flexDirection: 'row',
        height: '100%'
    }
});