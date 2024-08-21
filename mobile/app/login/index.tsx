import {ThemedView} from "@/components/ThemedView";
import {ThemedText} from "@/components/ThemedText";
import {SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet, TextInput, Text} from "react-native";
import {Colors} from "@/constants/Colors";
import {PrimaryButton} from "@/components/PrimaryButton";
import {useContentModel} from "@/store/store";
import {InputField} from "@/components/InputField";
import {fetchAPIConfig} from "@/lib/api";
import {getBaseURL, getByBaseURL, updateServerConfig} from "@/utils/sqlite";
import {router} from "expo-router";
import {ConfigData} from "@/models/ConfigData";


export default function LoginScreen() {
    const baseURL = useContentModel(state=>state.baseURL)
    const setBaseURL = useContentModel(state=>state.setBaseURL)

    const handleAuth = (r: ConfigData)=>{
        if (r.basicAuth) {
            // @ts-ignore
            router.replace('/login/basic')
        } else if (r.oidcConfigured) {
            // @ts-ignore
            router.replace('/login/oidc')
        }
    }

    return <SafeAreaView style={{flex: 1}}>
        <ThemedView style={styles.view}>
            <ThemedView style={{
            backgroundColor: Colors.background,
                width: '80%'
        }}>
            <InputField placeholder="Smarthome-URL" value={baseURL!} onChange={(e)=>{
                setBaseURL(e)
            }}  />
            <TextInput style={styles.input} value={baseURL} onChangeText={(e)=>{
              setBaseURL(e.toLowerCase())
            }}/>
            <PrimaryButton  title="Login" onClick={()=>{
                const isBaseURLPresent = getByBaseURL(baseURL!)
                if (isBaseURLPresent!= null) {
                    fetchAPIConfig(baseURL!)
                        .then(r => {
                            updateServerConfig(r, baseURL!)
                            useContentModel.getState().setConfig(r)
                            setBaseURL(baseURL!)
                            handleAuth(r)
                            return
                        })
                } else {
                    fetchAPIConfig(baseURL!)
                        .then(r => {
                            updateServerConfig(r, baseURL!)
                            useContentModel.getState().setConfig(r)
                            setBaseURL(baseURL!)
                            handleAuth(r)
                            return
                        })
                }

                // @ts-ignore
                router.replace('/main/home')
            }}/>
        </ThemedView>
    </ThemedView>
    </SafeAreaView>
}

export const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderRadius: 200,
        width: '60%'
    },
    button:{
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: Colors.color.green,
        color: '#fff'
    },
    view: {
        backgroundColor: Colors.background,
        justifyContent: 'center', //Centered vertically
        alignItems: 'center', //Centered horizontally
        flexDirection: 'row',
        flexGrow: 1
    }
});
