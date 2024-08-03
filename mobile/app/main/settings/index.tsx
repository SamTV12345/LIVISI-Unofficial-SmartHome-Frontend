import {ScrollView, View} from "react-native"
import {useContentModel} from "@/store/store";
import {SafeAreaView} from "react-native-safe-area-context";
import {ListItem} from "@/components/ListItem";
import {Colors} from "@/constants/Colors";
import {PrimaryButton} from "@/components/PrimaryButton";
import {setAllInactive} from "@/utils/sqlite";
import {router} from "expo-router";

export default function SettingsPage() {
    const allthings = useContentModel(state=>state.allThings)


    const logout = ()=>{
        setAllInactive()
        router.replace('/login')
    }

    return <SafeAreaView style={{backgroundColor: Colors.background}}>
        <ScrollView overScrollMode="never">
        <ListItem title="Gerätetreiber"/>
        <ListItem title="Gerätestandorte"/>
        <ListItem title="Lokales Zuhause"/>
        <ListItem title="Zentrale"/>
        <ListItem title="Softwareinformationen"/>
        <ListItem title="Geräteaktivitäten"/>
        <ListItem title="Impressum"/>
        <ListItem title="Netzwerk verwalten"/>
        <ListItem title="E-Mail"/>
        <View style={{display: 'flex', gap: 20, paddingLeft: 20, paddingRight: 20, paddingTop: 20, paddingBottom: 20}}>
            <PrimaryButton title="USB-Stick auswerfen" onClick={function (): void {
                throw new Error("Function not implemented.");
            }}/>
            <PrimaryButton title="Abmelden" onClick={logout}/>
        </View>
        </ScrollView>
    </SafeAreaView>
}