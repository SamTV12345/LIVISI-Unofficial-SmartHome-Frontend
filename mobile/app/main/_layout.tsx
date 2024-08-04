import {DarkTheme, DefaultTheme, ParamListBase, RouteProp, ThemeProvider} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Drawer } from '@/components/CustomDrawer';
import {Drawer as DDrawer} from 'expo-router/drawer'
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {fetchAPIAll} from "@/lib/api";
import {useContentModel} from "@/store/store";
import {Colors} from "@/constants/Colors";
import {FontAwesome, FontAwesome6} from "@expo/vector-icons";
import {DrawerNavigationOptions} from "@react-navigation/drawer";
import {StatusBar} from "expo-status-bar";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


const DrawerStyle = {
    drawerStyle: {
        backgroundColor: Colors.color.black,
    },
    drawerLabelStyle: {
        color: 'white'
    },
    headerTitleAlign: 'center',
    headerStyle: {
        backgroundColor: Colors.background,
        borderBottomWidth: 3,
        borderBottomColor: Colors.borderColor
    },
    headerTintColor: 'white',
    headerTitleStyle: {
        color: 'white',

    },
    drawerActiveTintColor: 'white',
}  satisfies DrawerNavigationOptions

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const baseURL = useContentModel(state=>state.baseURL)
    const resp = useContentModel(state=>state.setAllThings)

    useEffect(() => {
        if(baseURL == undefined) return
        console.log("Fetching data", baseURL)
        fetchAPIAll(baseURL)
            .then(c=>{
                resp(c)
            })
    }, [baseURL]);

    return (
        <ThemeProvider value={DarkTheme}>
            <GestureHandlerRootView style={{ flex: 1 }} >
                <Drawer>
                    <DDrawer.Screen
                        name="home/index"
                        options={{
                            ...DrawerStyle,
                            title: 'Home',
                            drawerIcon: ()=><FontAwesome style={{color: 'white', fontSize: 20}} name="home" />
                        }}
                    />
                    <DDrawer.Screen
                        name="devices/(tabs)"
                        options={{
                            ...DrawerStyle,
                            drawerLabel: 'Geräte',
                            title: 'Geräte',
                            drawerIcon: ()=><FontAwesome style={{color: 'white', fontSize: 30}} name="mobile-phone" />
                        }}
                    />
                    <DDrawer.Screen
                        name="settings/index"
                        options={{
                            ...DrawerStyle,
                            drawerLabel: 'Einstellungen',
                            title: 'Einstellungen',
                            drawerIcon: ()=><FontAwesome style={{color: 'white', fontSize: 25}} name="cog" />
                        }}
                    />
                </Drawer>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}
