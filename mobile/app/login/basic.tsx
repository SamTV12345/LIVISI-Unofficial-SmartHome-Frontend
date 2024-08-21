import {useContentModel} from "@/store/store";
import {StyleSheet, TextInput, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {InputField} from "@/components/InputField";
import {useState} from "react";
import ky from "ky";
import {PrimaryButton} from "@/components/PrimaryButton";
import {getByBaseURL, updateServerConfig} from "@/utils/sqlite";
import {fetchAPIConfig} from "@/lib/api";
import {router} from "expo-router";
import {ThemedView} from "@/components/ThemedView";
import {Colors} from "@/constants/Colors";

export default function () {
    const contentModel = useContentModel(state=>state.config)
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    return <SafeAreaView  style={{flex: 1}}>
            <View style={styles.view}>
                <View style={{width: '80%', gap: 10}}>
                    <InputField placeholder="Nutzername" value={username} onChange={(e)=>{
                        setUsername(e)
                    }}  />
                    <InputField value={password} onChange={(e)=>setPassword(e)} placeholder="Password" />
                    <PrimaryButton  title="Login" onClick={()=>{

                    }}/>
                </View>
            </View>
    </SafeAreaView>
}


const styles = StyleSheet.create({
    view: {
        backgroundColor: Colors.background,
        display: 'flex',
        flex:1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    input: {
        width: '60%'
    }
})
