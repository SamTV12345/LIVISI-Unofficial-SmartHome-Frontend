import {DefaultTheme, ThemeProvider} from "@react-navigation/native";
import {useCallback, useEffect, useMemo, useState} from "react";
import "react-native-reanimated";
import {ActivityIndicator, Pressable, Text, View} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {fetchAPIAll, saveEmailSettings} from "@/lib/api";
import {useContentModel} from "@/store/store";
import {Colors} from "@/constants/Colors";
import {FontAwesome, MaterialCommunityIcons} from "@expo/vector-icons";
import {Tabs} from "expo-router";

const REFRESH_INTERVAL_MS = 30_000;

export default function RootLayout() {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const gateway = useContentModel((state) => state.gateway);
    const allThings = useContentModel((state) => state.allThings);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | undefined>(undefined);
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const loadAllThings = useCallback(async () => {
        if (!gateway?.baseURL) {
            return;
        }

        try {
            const data = await fetchAPIAll(gateway);
            setAllThings(data);
            setLoadError(undefined);
        } catch {
            setLoadError("Daten konnten nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
    }, [gateway, setAllThings]);

    useEffect(() => {
        if (!gateway?.baseURL) {
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
    }, [gateway?.baseURL, loadAllThings]);

    const onSaveEmail = useCallback(async () => {
        if (!gateway?.baseURL || !allThings?.email || isSavingEmail) {
            return;
        }

        setIsSavingEmail(true);
        try {
            await saveEmailSettings(gateway, allThings.email);
            setLoadError(undefined);
        } catch {
            setLoadError("E-Mail-Einstellungen konnten nicht gespeichert werden.");
        } finally {
            setIsSavingEmail(false);
        }
    }, [allThings?.email, gateway, isSavingEmail]);

    const tabScreenOptions = useMemo(() => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.app.primary,
        tabBarInactiveTintColor: Colors.app.textMuted,
        tabBarStyle: {
            borderTopColor: Colors.app.border,
            borderTopWidth: 1,
            backgroundColor: Colors.app.surface,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600" as const
        }
    }), []);

    if (isLoading && !allThings) {
        return (
            <ThemeProvider value={DefaultTheme}>
                <View style={{
                    flex: 1,
                    backgroundColor: Colors.app.background,
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <ActivityIndicator color={Colors.app.primary} size="large"/>
                    <Text style={{color: Colors.app.text, marginTop: 12}}>Lade SmartHome-Daten...</Text>
                </View>
            </ThemeProvider>
        );
    }

    if (loadError && !allThings) {
        return (
            <ThemeProvider value={DefaultTheme}>
                <View style={{
                    flex: 1,
                    backgroundColor: Colors.app.background,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20
                }}>
                    <Text style={{color: Colors.app.text, textAlign: "center", marginBottom: 20}}>{loadError}</Text>
                    <Pressable onPress={() => {
                        setIsLoading(true);
                        void loadAllThings();
                    }} style={{
                        backgroundColor: Colors.app.primary,
                        borderRadius: 999,
                        paddingHorizontal: 20,
                        paddingVertical: 10
                    }}>
                        <Text style={{color: "white", fontWeight: "700"}}>Erneut versuchen</Text>
                    </Pressable>
                </View>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider value={DefaultTheme}>
            <GestureHandlerRootView style={{flex: 1}}>
                {loadError && allThings && <View style={{
                    backgroundColor: Colors.app.warningSoft,
                    borderColor: Colors.app.warningBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    marginHorizontal: 16,
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10
                }}>
                    <Text style={{color: Colors.app.warningText}}>{loadError}</Text>
                    <Pressable onPress={() => {
                        void loadAllThings();
                    }}>
                        <Text style={{
                            color: Colors.app.warningText,
                            textDecorationLine: "underline",
                            marginTop: 6
                        }}>
                            Erneut versuchen
                        </Text>
                    </Pressable>
                </View>}
                <Tabs screenOptions={tabScreenOptions}>
                    <Tabs.Screen
                        name="devices/(tabs)/index"
                        options={{
                            title: "Zuhause",
                            tabBarIcon: ({color}) => <FontAwesome size={20} name="home" color={color}/>
                        }}
                    />
                    <Tabs.Screen
                        name="devices/(tabs)/rooms"
                        options={{
                            title: "Geräte",
                            tabBarIcon: ({color}) => <MaterialCommunityIcons size={22} name="view-grid-outline" color={color}/>
                        }}
                    />
                    <Tabs.Screen
                        name="settings/index"
                        options={{
                            title: "Einstellungen",
                            tabBarIcon: ({color}) => <FontAwesome size={20} name="cog" color={color}/>
                        }}
                    />
                    <Tabs.Screen name="devices/(tabs)/devices" options={{href: null, headerShown: false}} />
                    <Tabs.Screen name="home/index" options={{href: null}}/>
                    <Tabs.Screen
                        name="settings/network"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Netzwerk",
                            headerTintColor: Colors.app.text
                        }}
                    />
                    <Tabs.Screen
                        name="settings/gateway"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Gateway",
                            headerTintColor: Colors.app.text
                        }}
                    />
                    <Tabs.Screen
                        name="settings/email"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "E-Mail",
                            headerTintColor: Colors.app.text,
                            headerRight: () => (
                                <Text
                                    style={{color: Colors.app.primary, marginRight: 16, fontSize: 17, lineHeight: 22}}
                                    onPress={onSaveEmail}
                                >
                                    {isSavingEmail ? "Speichert..." : "Speichern"}
                                </Text>
                            )
                        }}
                    />
                    <Tabs.Screen
                        name="devices/device/[deviceId]"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Gerätedetails",
                            headerTintColor: Colors.app.text
                        }}
                    />
                </Tabs>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}
