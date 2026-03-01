import {useMemo} from "react";
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {router} from "expo-router";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {Colors} from "@/constants/Colors";
import {useContentModel} from "@/store/store";
import {ErrorBanner} from "@/components/ErrorBanner";
import {determineTitleAndDescription} from "@/utils/messageDetermining";
import {formatTime} from "@/utils/timeUtils";
import {useGatewayApi} from "@/hooks/useGatewayApi";

export default function NewsScreen() {
    const gateway = useContentModel((state) => state.gateway);
    const gatewayApi = useGatewayApi();

    const {data, isError, isFetching, refetch} = gatewayApi.useQuery("get", "/message", undefined, {
        enabled: Boolean(gateway?.baseURL)
    });

    const messages = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }, [data]);

    const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => void refetch()}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title="Nachrichten"
                    subtitle="Systemmeldungen, Warnungen und Statusupdates."
                    badges={[
                        {
                            label: `${messages.length} Nachrichten`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="email-outline"/>
                        },
                        {
                            label: `${unreadCount} ungelesen`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="bell-outline"/>
                        }
                    ]}
                    stats={[
                        {label: "Gesamt", value: messages.length},
                        {label: "Ungelesen", value: unreadCount},
                        {label: "Gelesen", value: messages.length - unreadCount},
                        {label: "Neueste", value: messages[0] ? formatTime(messages[0].timestamp) : "-"}
                    ]}
                />

                {isError && (
                    <ErrorBanner message="Nachrichten konnten nicht geladen werden." onRetry={() => void refetch()}/>
                )}

                <ModernSection
                    title="Nachrichtenliste"
                    description="Tippe auf eine Nachricht fuer die Detailansicht"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="text-box-outline"/>}
                    style={{marginBottom: 14}}
                >
                    {messages.length === 0 && !isFetching && (
                        <Text style={styles.emptyText}>Keine Nachrichten vorhanden.</Text>
                    )}
                    {messages.map((message, index) => {
                        const presentation = determineTitleAndDescription(message);
                        return (
                            <Pressable
                                key={message.id}
                                onPress={() => router.push({
                                    pathname: "/main/news/[messageId]",
                                    params: {messageId: message.id}
                                })}
                                style={({pressed}) => [
                                    styles.messageCard,
                                    index < messages.length - 1 && styles.messageCardGap,
                                    pressed && {opacity: 0.84}
                                ]}
                            >
                                <View style={styles.messageTopRow}>
                                    <View style={[styles.statusDot, message.read ? styles.statusDotRead : styles.statusDotUnread]}/>
                                    <Text style={[styles.messageTitle, message.read && styles.messageTitleRead]} numberOfLines={1}>
                                        {presentation.title}
                                    </Text>
                                    <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                                </View>
                                <Text style={styles.messageDescription} numberOfLines={3}>
                                    {presentation.description}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ModernSection>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    emptyText: {
        color: Colors.app.textMuted
    },
    messageCard: {
        borderWidth: 1,
        borderColor: Colors.app.border,
        borderRadius: 12,
        backgroundColor: Colors.app.surfaceSoft,
        paddingHorizontal: 11,
        paddingVertical: 10
    },
    messageCardGap: {
        marginBottom: 8
    },
    messageTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    statusDot: {
        width: 9,
        height: 9,
        borderRadius: 999
    },
    statusDotUnread: {
        backgroundColor: "#86b919"
    },
    statusDotRead: {
        backgroundColor: "#ccd8e3"
    },
    messageTitle: {
        color: Colors.app.text,
        fontWeight: "700",
        flex: 1
    },
    messageTitleRead: {
        color: "#687d92"
    },
    messageTime: {
        color: Colors.app.textMuted,
        fontSize: 11
    },
    messageDescription: {
        color: Colors.app.textMuted,
        marginTop: 5,
        lineHeight: 19
    }
});
