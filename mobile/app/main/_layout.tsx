import {DarkTheme, ThemeProvider} from "@react-navigation/native";
import {useCallback, useEffect, useState} from "react";
import "react-native-reanimated";
import {Text, View, Pressable, ActivityIndicator} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {fetchAPIAll, saveEmailSettings} from "@/lib/api";
import {useContentModel} from "@/store/store";
import {Colors} from "@/constants/Colors";
import {FontAwesome} from "@expo/vector-icons";
import {Tabs} from "expo-router";

const REFRESH_INTERVAL_MS = 30_000;

export default function RootLayout() {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const baseURL = useContentModel((state) => state.baseURL);
    const allThings = useContentModel((state) => state.allThings);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | undefined>(undefined);
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const loadAllThings = useCallback(async () => {
        if (!baseURL) {
            return;
        }

        try {
            const data = await fetchAPIAll(baseURL);
            setAllThings(data);
            setLoadError(undefined);
        } catch (error) {
            setLoadError("Daten konnten nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
    }, [baseURL, setAllThings]);

    useEffect(() => {
        if (!baseURL) {
            return;
        }

        setIsLoading(true);
        void loadAllThings();
        const interval = setInterval(() => {
            void loadAllThings();
        }, REFRESH_INTERVAL_MS);

        return () => {
            clearInterval(interval);
        };
    }, [baseURL, loadAllThings]);

    const onSaveEmail = useCallback(async () => {
        if (!baseURL || !allThings?.email || isSavingEmail) {
            return;
        }

        setIsSavingEmail(true);
        try {
            await saveEmailSettings(baseURL, allThings.email);
            setLoadError(undefined);
        } catch (error) {
            setLoadError("E-Mail-Einstellungen konnten nicht gespeichert werden.");
        } finally {
            setIsSavingEmail(false);
        }
    }, [allThings?.email, baseURL, isSavingEmail]);

    if (isLoading && !allThings) {
        return (
            <ThemeProvider value={DarkTheme}>
                <View style={{
                    flex: 1,
                    backgroundColor: Colors.background,
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <ActivityIndicator color={Colors.color.white} size="large"/>
                    <Text style={{color: "white", marginTop: 10}}>Lade SmartHome-Daten...</Text>
                </View>
            </ThemeProvider>
        );
    }

    if (loadError && !allThings) {
        return (
            <ThemeProvider value={DarkTheme}>
                <View style={{
                    flex: 1,
                    backgroundColor: Colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20
                }}>
                    <Text style={{color: "white", textAlign: "center", marginBottom: 20}}>{loadError}</Text>
                    <Pressable onPress={() => {
                        setIsLoading(true);
                        void loadAllThings();
                    }} style={{
                        borderColor: Colors.borderColor,
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 20,
                        paddingVertical: 10
                    }}>
                        <Text style={{color: "white"}}>Erneut versuchen</Text>
                    </Pressable>
                </View>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider value={DarkTheme}>
            <GestureHandlerRootView style={{flex: 1}}>
                {loadError && allThings && <View style={{
                    backgroundColor: "#5f1f1f",
                    borderColor: "#ff6b6b",
                    borderWidth: 1,
                    borderRadius: 8,
                    marginHorizontal: 14,
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10
                }}>
                    <Text style={{color: "#ffe0e0"}}>{loadError}</Text>
                    <Pressable onPress={() => {
                        void loadAllThings();
                    }}>
                        <Text style={{color: "#ffd9d9", textDecorationLine: "underline", marginTop: 6}}>
                            Erneut versuchen
                        </Text>
                    </Pressable>
                </View>}
                <Tabs screenOptions={{
                    tabBarActiveTintColor: "white",
                    tabBarInactiveBackgroundColor: Colors.background,
                    tabBarActiveBackgroundColor: Colors.background,
                    tabBarStyle: {
                        borderTopColor: Colors.borderColor,
                        borderTopWidth: 2
                    },
                    tabBarHideOnKeyboard: true
                }}>
                    <Tabs.Screen
                        name="devices/(tabs)/index"
                        options={{
                            headerShown: false,
                            title: "Zuhause",
                            tabBarIcon: ({color}) => <FontAwesome size={28} name="home" color={color}/>
                        }}
                    />
                    <Tabs.Screen
                        name="devices/(tabs)/rooms"
                        options={{
                            headerShown: false,
                            title: "Bereiche",
                            tabBarIcon: ({color}) => <FontAwesome size={28} name="th-large" color={color}/>
                        }}
                    />
                    <Tabs.Screen
                        name="devices/(tabs)/devices"
                        options={{
                            headerShown: false,
                            href: null,
                            title: "Geräte",
                            tabBarIcon: ({color}) => <FontAwesome size={28} name="cog" color={color}/>
                        }}
                    />
                    <Tabs.Screen
                        name="settings/index"
                        options={{
                            headerShown: false,
                            title: "Einstellungen",
                            tabBarIcon: ({color}) => <FontAwesome size={28} name="cog" color={color}/>
                        }}
                    />
                    <Tabs.Screen name="home/index" options={{href: null}}/>
                    <Tabs.Screen name="settings/network" options={{href: null, headerShown: true, title: "Netzwerk"}}/>
                    <Tabs.Screen
                        name="settings/email"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "E-Mail",
                            headerRight: () => (
                                <Text style={{color: "#0385FF", marginRight: 20, fontSize: 17, lineHeight: 22}}
                                      onPress={onSaveEmail}>
                                    {isSavingEmail ? "Speichert..." : "Speichern"}
                                </Text>
                            )
                        }}
                    />
                </Tabs>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}
