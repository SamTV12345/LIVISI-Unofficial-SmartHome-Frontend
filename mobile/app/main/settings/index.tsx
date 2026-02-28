import {RefreshControl, ScrollView, View} from "react-native"
import {useContentModel} from "@/store/store";
import {SafeAreaView} from "react-native-safe-area-context";
import {ListItem} from "@/components/ListItem";
import {Colors} from "@/constants/Colors";
import {setAllInactive} from "@/utils/sqlite";
import {router} from "expo-router";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListSeparator} from "@/components/ListSeparator";
import {StatusBar} from "expo-status-bar";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";

export default function SettingsPage() {
    const allthings = useContentModel(state=>state.allThings)
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();


    const logout = ()=>{
        setAllInactive()
        router.replace('/login')
    }

    return <SafeAreaView style={{backgroundColor: Colors.background, minHeight: '100%'}}>
        <StatusBar style="light" />
        <ScrollView
            overScrollMode="always"
            style={{marginTop: 20, display: 'flex', gap: 20, flexDirection: 'column'}}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                void refreshAllThings();
            }}/>}
        >
                {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
                    void refreshAllThings();
                }}/>}
                {!allthings && <ErrorBanner message="SmartHome-Daten werden noch geladen."/>}
                <ListItemIsland style={{marginBottom: 20}}>
                    <ListItem title="Gerätetreiber"/>
                    <ListSeparator/>
                    <ListItem title="Gerätestandorte"/>
                </ListItemIsland>


                <ListItemIsland style={{marginBottom: 20}}>
                    <ListItem title="Lokales Zuhause"/>
                    <ListSeparator/>
                    <ListItem title="Zentrale"/>
                    <ListSeparator/>
                    <ListItem title="Softwareinformationen"/>
                </ListItemIsland>

                <ListItemIsland style={{marginBottom: 20}}>
                    <ListItem title="Geräteaktivitäten"/>
                    <ListSeparator/>
                    <ListItem title="Impressum"/>
                    <ListSeparator/>
                    <ListItem title="Netzwerk verwalten" to="/main/settings/network"/>
                    <ListSeparator/>
                    <ListItem title="E-Mail" to="/main/settings/email"/>
                </ListItemIsland>

                <ListItemIsland style={{marginBottom: 20}}>
                    <ListItem title="USB-Stick auswerfen" type="action" onClick={function (): void {
                        throw new Error("Function not implemented.");
                    }}  />
                    <ListItem  title="Abmelden" onClick={logout} type="action"/>
                </ListItemIsland>
        </ScrollView>
    </SafeAreaView>
}
