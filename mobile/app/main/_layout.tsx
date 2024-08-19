import {DarkTheme, DefaultTheme, ParamListBase, RouteProp, ThemeProvider} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {Text} from 'react-native'
import 'react-native-reanimated';
import { Drawer } from '@/components/CustomDrawer';
import {Drawer as DDrawer} from 'expo-router/drawer'
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {fetchAPIAll, saveEmailSettings} from "@/lib/api";
import {useContentModel} from "@/store/store";
import {Colors} from "@/constants/Colors";
import {FontAwesome, FontAwesome6} from "@expo/vector-icons";
import {DrawerNavigationOptions} from "@react-navigation/drawer";
import {StatusBar} from "expo-status-bar";
import {Tabs} from "expo-router";

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
    const resp = useContentModel(state=>state.setAllThings)
    const baseURL = useContentModel(state=>state.baseURL)
    const allthings = useContentModel(state=>state.allThings)

    useEffect(() => {
        if(baseURL == undefined) return
        fetchAPIAll(baseURL)
            .then(c=>{
                resp(c)
            })
    }, [baseURL]);

    return (
        <ThemeProvider value={DarkTheme}>
            <GestureHandlerRootView style={{ flex: 1 }} >
                <Tabs screenOptions={{ tabBarActiveTintColor: 'white', tabBarInactiveBackgroundColor: Colors.background,
                    tabBarActiveBackgroundColor: Colors.background, tabBarStyle: {
                        borderTopColor: Colors.borderColor,
                        borderTopWidth: 2
                    },
                    tabBarHideOnKeyboard: true
                }}>
                    <Tabs.Screen
                        name="devices/(tabs)/index"
                        options={{
                            headerShown: false,
                            title: 'Zuhause',
                            tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="devices/(tabs)/rooms"
                        options={{
                            headerShown: false,
                            title: 'Bereiche',
                            tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="devices/(tabs)/devices"
                        options={{
                            headerShown: false,
                            href: null,
                            title: 'Bereiche',
                            tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
                        }}
                    />
                    <Tabs.Screen name="settings/index"
                                 options={{
                                     headerShown: false,
                                     title: 'Einstellungen',
                                     tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
                                 }}/>
                    <Tabs.Screen name="home/index" options={{href: null}}/>
                    <Tabs.Screen name="settings/network" options={{href: null, headerShown: true, title: "Netzwerk"}}/>
                    <Tabs.Screen name="settings/email" options={{href: null, headerShown: true, title: "E-Mail", headerRight:()=>{
                            return <Text style={{color: '#0385FF', marginRight: 20}} onPress={()=>{
                                saveEmailSettings(baseURL!, allthings!.email!)
                            }}>Speichern</Text>
                        }}}/>
                </Tabs>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}
