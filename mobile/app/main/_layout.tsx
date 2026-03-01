import {ThemeProvider} from "@react-navigation/native";
import {useCallback, useEffect, useMemo, useState} from "react";
import "react-native-reanimated";
import {Pressable, Text, View} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {AxiosDeviceResponse, useContentModel} from "@/store/store";
import {FontAwesome, MaterialCommunityIcons} from "@expo/vector-icons";
import {Href, router, Tabs, useNavigation} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {createGatewayQueryClient} from "@/lib/openapi/client";
import {MainLoadingSkeleton} from "@/components/ui/Skeleton";
import {useAppColors, useNavigationTheme} from "@/hooks/useAppColors";

const REFRESH_INTERVAL_MS = 30_000;

export default function RootLayout() {
    const appColors = useAppColors();
    const navigationTheme = useNavigationTheme();
    const setAllThings = useContentModel((state) => state.setAllThings);
    const gateway = useContentModel((state) => state.gateway);
    const allThings = useContentModel((state) => state.allThings);
    const [loadError, setLoadError] = useState<string | undefined>(undefined);
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const unreadMessageCount = useMemo(
        () => (allThings?.messages ?? []).filter((message) => !message.read).length,
        [allThings?.messages]
    );

    const renderDetailBackButton = useCallback((fallbackRoute: Href) => (
        <Pressable
            onPress={() => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                    return;
                }
                router.replace(fallbackRoute);
            }}
            style={{marginLeft: 8, padding: 4}}
            hitSlop={10}
        >
            <MaterialCommunityIcons size={22} color={appColors.text} name="chevron-left"/>
        </Pressable>
    ), [appColors.text, navigation]);

    const gatewayIdentity = useMemo(() => ({
        baseURL: gateway?.baseURL ?? "http://127.0.0.1",
        username: gateway?.username ?? "",
        password: gateway?.password ?? ""
    }), [gateway?.baseURL, gateway?.password, gateway?.username]);

    const gatewayApi = useMemo(() => {
        return createGatewayQueryClient(gatewayIdentity);
    }, [gatewayIdentity]);
    const saveEmailMutation = gatewayApi.useMutation("put", "/email/settings");

    const allThingsQuery = gatewayApi.useQuery("get", "/api/all", undefined, {
        enabled: Boolean(gateway?.baseURL),
        refetchInterval: REFRESH_INTERVAL_MS
    });

    const refetchAllThings = useCallback(() => {
        void allThingsQuery.refetch();
    }, [allThingsQuery]);

    useEffect(() => {
        const data = allThingsQuery.data as AxiosDeviceResponse | undefined;
        if (!data) {
            return;
        }
        setAllThings(data);
        setLoadError(undefined);
    }, [allThingsQuery.data, setAllThings]);

    useEffect(() => {
        if (!allThingsQuery.isError) {
            return;
        }
        setLoadError("Daten konnten nicht geladen werden.");
    }, [allThingsQuery.isError]);

    const onSaveEmail = useCallback(async () => {
        if (!gateway?.baseURL || !allThings?.email || isSavingEmail) {
            return;
        }

        setIsSavingEmail(true);
        try {
            await saveEmailMutation.mutateAsync({
                body: allThings.email
            });
            setLoadError(undefined);
        } catch {
            setLoadError("E-Mail-Einstellungen konnten nicht gespeichert werden.");
        } finally {
            setIsSavingEmail(false);
        }
    }, [allThings?.email, gateway?.baseURL, isSavingEmail, saveEmailMutation]);

    const tabBarSafeBottom = Math.max(insets.bottom, 10);
    const tabBarHeight = 58 + tabBarSafeBottom;
    const tabBarVerticalPadding = 6;
    const tabScreenOptions = useMemo(() => ({
        headerShown: false,
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.textMuted,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
            backgroundColor: appColors.background,
            paddingBottom: tabBarHeight + 8
        },
        tabBarStyle: {
            position: "absolute" as const,
            left: 0,
            right: 0,
            bottom: 0,
            borderTopWidth: 1,
            borderTopColor: appColors.borderStrong,
            backgroundColor: appColors.surfaceRaised,
            height: tabBarHeight,
            paddingBottom: tabBarSafeBottom,
            paddingTop: tabBarVerticalPadding,
            paddingHorizontal: 8
        },
        tabBarItemStyle: {
            borderRadius: 10,
            marginHorizontal: 1,
            marginVertical: 1,
            backgroundColor: "transparent",
            paddingHorizontal: 1
        },
        tabBarIconStyle: {
            marginTop: 1
        },
        tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600" as const,
            marginBottom: 1
        },
        tabBarBadgeStyle: {
            backgroundColor: appColors.accent,
            color: appColors.surface,
            fontSize: 10,
            fontWeight: "700" as const
        }
    }), [appColors.accent, appColors.background, appColors.borderStrong, appColors.primary, appColors.surface, appColors.surfaceRaised, appColors.textMuted, tabBarHeight, tabBarSafeBottom, tabBarVerticalPadding]);

    if ((allThingsQuery.isLoading || allThingsQuery.isFetching) && !allThings) {
        return (
            <ThemeProvider value={navigationTheme}>
                <MainLoadingSkeleton/>
            </ThemeProvider>
        );
    }

    if (loadError && !allThings) {
        return (
            <ThemeProvider value={navigationTheme}>
                <View style={{
                    flex: 1,
                    backgroundColor: appColors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20
                    }}>
                    <Text style={{color: appColors.text, textAlign: "center", marginBottom: 20}}>{loadError}</Text>
                    <Pressable onPress={() => {
                        refetchAllThings();
                    }} style={{
                        backgroundColor: appColors.primary,
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
        <ThemeProvider value={navigationTheme}>
            <GestureHandlerRootView style={{flex: 1}}>
                {loadError && allThings && <View style={{
                    backgroundColor: appColors.warningSoft,
                    borderColor: appColors.warningBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    marginHorizontal: 16,
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10
                }}>
                        <Text style={{color: appColors.warningText}}>{loadError}</Text>
                        <Pressable onPress={() => {
                            refetchAllThings();
                        }}>
                            <Text style={{
                                color: appColors.warningText,
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
                        name="automation/index"
                        options={{
                            title: "Automation",
                            tabBarIcon: ({color}) => <MaterialCommunityIcons size={22} name="source-branch" color={color}/>
                        }}
                    />
                    <Tabs.Screen
                        name="settings/index"
                        options={{
                            title: "Einstellungen",
                            tabBarBadge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
                            tabBarIcon: ({color}) => <FontAwesome size={20} name="cog" color={color}/>
                        }}
                    />
                    <Tabs.Screen name="news/index" options={{href: null}}/>
                    <Tabs.Screen name="devices/(tabs)/devices" options={{href: null, headerShown: false}} />
                    <Tabs.Screen name="home/index" options={{href: null}}/>
                    <Tabs.Screen
                        name="settings/network"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Netzwerk",
                            headerTintColor: appColors.text,
                            headerStyle: {backgroundColor: appColors.surfaceRaised},
                            headerLeft: () => renderDetailBackButton("/main/settings")
                        }}
                    />
                    <Tabs.Screen
                        name="settings/gateway"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Gateway",
                            headerTintColor: appColors.text,
                            headerStyle: {backgroundColor: appColors.surfaceRaised},
                            headerLeft: () => renderDetailBackButton("/main/settings")
                        }}
                    />
                    <Tabs.Screen
                        name="settings/email"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "E-Mail",
                            headerTintColor: appColors.text,
                            headerStyle: {backgroundColor: appColors.surfaceRaised},
                            headerLeft: () => renderDetailBackButton("/main/settings"),
                            headerRight: () => (
                                <Text
                                    style={{color: appColors.primary, marginRight: 16, fontSize: 17, lineHeight: 22}}
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
                            headerTintColor: appColors.text,
                            headerStyle: {backgroundColor: appColors.surfaceRaised},
                            headerLeft: () => renderDetailBackButton("/main/devices/(tabs)")
                        }}
                    />
                    <Tabs.Screen
                        name="automation/[interactionId]"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Automation",
                            headerTintColor: appColors.text,
                            headerStyle: {backgroundColor: appColors.surfaceRaised},
                            headerLeft: () => renderDetailBackButton("/main/automation")
                        }}
                    />
                    <Tabs.Screen
                        name="news/[messageId]"
                        options={{
                            href: null,
                            headerShown: true,
                            title: "Nachricht",
                            headerTintColor: appColors.text,
                            headerStyle: {backgroundColor: appColors.surfaceRaised},
                            headerLeft: () => renderDetailBackButton("/main/news")
                        }}
                    />
                </Tabs>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}
