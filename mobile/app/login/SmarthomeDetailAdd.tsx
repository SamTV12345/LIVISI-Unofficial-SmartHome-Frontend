import {ThemedView} from "@/components/ThemedView";
import {Text} from 'react-native'
import {styles} from "@/app/login/index";
import {ThemedText} from "@/components/ThemedText";
import {InputField} from "@/components/InputField";
import {PrimaryButton} from "@/components/PrimaryButton";
import {useState} from "react";
import {isValidHttpUrl} from "@/utils/url";
import {fetchAPIConfig} from "@/lib/api";
import {saveBaseURL} from "@/utils/sqlite";
import {Href, router} from "expo-router";

export default function SmarthomeDetailAdd() {
    const [baseURL, setBaseURL] = useState<string>('')
    const [error, setError] = useState<string>('')

    return (
        <ThemedView style={[styles.view, {
            backgroundColor: 'transparent',
            width: '80%',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            gap: 20,
            flexDirection: 'column',
        }]}>
            <InputField error={error} placeholder="Smarthome-URL" value={baseURL!} onChange={(e)=>{
                setBaseURL(e)
            }} />
            <PrimaryButton title="Verbindung testen" onClick={()=>{
                const newBase = baseURL.trim().toLowerCase()
                setBaseURL(newBase)
                const result = isValidHttpUrl(newBase)
                if (!result) {
                    setError('URL ist nicht gültig')
                    return
                }

                fetchAPIConfig(newBase)
                    .then((_)=>{
                        console.log("Saving data")
                        saveBaseURL(newBase)
                        return router.replace("/login/smarthomeSelection" as Href)
                    }).catch((reason)=>{
                        if (reason instanceof TypeError) {
                            setError('Server nicht erreichbar')
                            return
                        }

                        console.log(reason)

                        if (reason === "Error retrieving data") {
                            setError('URL ist nicht erreichbar')
                            return
                        } else if (reason.includes('JSON Parse error')) {
                            setError('SmartHome-Server nicht erkannt')
                        } else if (reason.includes('Network request failed')) {
                            setError('Server nicht erreichbar')
                        }
                    })
            }}/>
        </ThemedView>
    );
}
