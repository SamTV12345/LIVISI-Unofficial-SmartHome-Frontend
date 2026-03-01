import {useMemo} from "react";
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {router} from "expo-router";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {Colors} from "@/constants/Colors";
import {useContentModel} from "@/store/store";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";
import {determineTitleAndDescription} from "@/utils/messageDetermining";
import {formatTime} from "@/utils/timeUtils";

export default function NewsScreen() {
    const allThings = useContentModel((state) => state.allThings);
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const sortedMessages = useMemo(() => {
        return [...(allThings?.messages ?? [])].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
    }, [allThings?.messages]);

    const unreadCount = useMemo(() => sortedMessages.filter((message) => !message.read).length, [sortedMessages]);

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void refreshAllThings();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title="Nachrichten"
                    subtitle="Systemmeldungen, Warnungen und Statusupdates an einem Ort."
                    badges={[
                        {
                            label: `${sortedMessages.length} Nachrichten`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="email-outline"/>
                        },
                        {
                            label: `${unreadCount} ungelesen`,
                            icon: <MaterialCommunityIcons size={12} color="white" name="bell-outline"/>
                        }
                    ]}
                    stats={[
                        {label: "Gesamt", value: sortedMessages.length},
                        {label: "Ungelesen", value: unreadCount},
                        {label: "Gelesen", value: Math.max(0, sortedMessages.length - unreadCount)},
                        {label: "Neueste", value: sortedMessages[0] ? formatTime(sortedMessages[0].timestamp) : "-"}
                    ]}
                />

                {refreshError ? <ErrorBanner message={refreshError}/> : null}

                <ModernSection
                    title="Nachrichtenliste"
                    description="Tippe auf eine Nachricht fuer die Detailansicht"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="text-box-outline"/>}
                    style={{marginBottom: 14}}
                >
                    {sortedMessages.length === 0 && (
                        <Text style={styles.emptyText}>Keine Nachrichten vorhanden.</Text>
                    )}
                    {sortedMessages.map((message, index) => {
                        const presentation = determineTitleAndDescription(message);
                        return (
                            <Pressable
                                key={message.id}
                                onPress={() => {
                                    router.push({
                                        pathname: "/main/news/[messageId]",
                                        params: {messageId: message.id}
                                    });
                                }}
                                style={({pressed}) => [
                                    styles.messageCard,
                                    index < sortedMessages.length - 1 ? styles.messageCardGap : null,
                                    pressed ? {opacity: 0.84} : null
                                ]}
                            >
                                <View style={styles.messageTopRow}>
                                    <View style={[styles.statusDot, message.read ? styles.statusDotRead : styles.statusDotUnread]}/>
                                    <Text style={[styles.messageTitle, message.read ? styles.messageTitleRead : null]} numberOfLines={1}>
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
