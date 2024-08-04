import {ScrollView, View} from "react-native"
import {useContentModel} from "@/store/store";
import {SafeAreaView} from "react-native-safe-area-context";
import {ListItem} from "@/components/ListItem";
import {Colors} from "@/constants/Colors";
import {PrimaryButton} from "@/components/PrimaryButton";
import {setAllInactive} from "@/utils/sqlite";
import {router} from "expo-router";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListSeparator} from "@/components/ListSeparator";

export default function SettingsPage() {
    const allthings = useContentModel(state=>state.allThings)


    const logout = ()=>{
        setAllInactive()
        router.replace('/login')
    }

    return <SafeAreaView style={{backgroundColor: Colors.background, minHeight: '100%'}}>
        <ScrollView overScrollMode="never" style={{}}>
            <View style={{display: 'flex', gap: 20, flexDirection: 'column'}}>
                <ListItemIsland>
                    <ListItem title="Gerätetreiber"/>
                    <ListSeparator/>
                    <ListItem title="Gerätestandorte"/>
                </ListItemIsland>


                <ListItemIsland>
                    <ListItem title="Lokales Zuhause"/>
                    <ListSeparator/>
                    <ListItem title="Zentrale"/>
                    <ListSeparator/>
                    <ListItem title="Softwareinformationen"/>
                </ListItemIsland>

                <ListItemIsland>
                    <ListItem title="Geräteaktivitäten"/>
                    <ListSeparator/>
                    <ListItem title="Impressum"/>
                    <ListSeparator/>
                    <ListItem title="Netzwerk verwalten"/>
                    <ListSeparator/>
                    <ListItem title="E-Mail"/>
                </ListItemIsland>

                <ListItemIsland>
                    <ListItem title="USB-Stick auswerfen" type="action" onClick={function (): void {
                        throw new Error("Function not implemented.");
                    }}  />
                    <ListItem  title="Abmelden" onClick={logout} type="action"/>
                </ListItemIsland>

            </View>
        </ScrollView>
    </SafeAreaView>
}
