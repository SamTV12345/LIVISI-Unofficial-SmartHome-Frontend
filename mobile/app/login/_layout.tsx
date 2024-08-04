import {Href, router, Stack} from "expo-router";
import {FontAwesome} from "@expo/vector-icons";
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Login() {
    return  (
        <Stack
            screenOptions={{
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                navigationBarHidden: true,
                statusBarStyle:'dark'
            }}>
            <Stack.Screen name="index" options={{
                title: 'Livisi Smarthome',
                headerRight: ()=><FontAwesome onPress={()=>{
                    router.replace("/login/smarthomeSelection" as  Href<string | object>)
                }} color="white" size={20} name="cog"/>,
            }} />
            <Stack.Screen name="smarthomeSelection" options={{
                title: 'Smarthome auswählen',
                headerTitleAlign: 'center',
                headerLeft: ()=><AntDesign onPress={()=>{
                    router.replace("/login")
                }} color="white" size={20} name="arrowleft"/>,
                headerRight: ()=><AntDesign onPress={()=>{
                    router.replace("/login/SmarthomeDetailAdd"  as  Href<string | object>)
                }} color="white" size={20} name="plus"/>,
            }} />
            <Stack.Screen name="SmarthomeDetailAdd" options={{
                title: 'Smarthome hinzufügen',
                headerTitleAlign: 'center',
                headerLeft: ()=><AntDesign onPress={()=>{
                    router.replace("/login/smarthomeSelection"  as  Href<string | object>)
                }} color="white" size={20} name="arrowleft"/>,
            }} />
        </Stack>
    );
}
