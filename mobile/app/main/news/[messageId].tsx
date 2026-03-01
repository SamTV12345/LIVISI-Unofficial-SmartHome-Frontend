import {useCallback, useEffect, useMemo, useState} from "react";
import {RefreshControl, ScrollView, StyleSheet, Text} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {ErrorBanner} from "@/components/ErrorBanner";
import {Colors} from "@/constants/Colors";
import {fetchMessageById, markMessageAsRead} from "@/lib/api";
import {useContentModel} from "@/store/store";
import {Message} from "@/models/Messages";
import {determineTitleAndDescription} from "@/utils/messageDetermining";
import {formatTime} from "@/utils/timeUtils";

export default function NewsDetailScreen() {
    const {messageId} = useLocalSearchParams<{messageId: string}>();
    const gateway = useContentModel((state) => state.gateway);
    const allThings = useContentModel((state) => state.allThings);
    const setAllThings = useContentModel((state) => state.setAllThings);

    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [message, setMessage] = useState<Message | undefined>(undefined);

    const persistMessage = useCallback((nextMessage: Message) => {
        const currentState = useContentModel.getState().allThings;
        if (!currentState) {
            return;
        }
        const currentMessages = currentState.messages ?? [];
        const nextMessages = currentMessages.some((entry) => entry.id === nextMessage.id)
            ? currentMessages.map((entry) => entry.id === nextMessage.id ? nextMessage : entry)
            : [...currentMessages, nextMessage];

        setAllThings({
            ...currentState,
            messages: nextMessages
        });
    }, [setAllThings]);

    const loadMessage = useCallback(async () => {
        if (!gateway?.baseURL || !messageId) {
            return;
        }
        setRefreshing(true);
        try {
            const fetchedMessage = await fetchMessageById(gateway, messageId);
            setMessage(fetchedMessage);
            persistMessage(fetchedMessage);
            setError(undefined);
        } catch {
            setError("Nachricht konnte nicht geladen werden.");
        } finally {
            setRefreshing(false);
        }
    }, [gateway, messageId, persistMessage]);

    useEffect(() => {
        if (!messageId) {
            return;
        }

        const localMessage = allThings?.messages?.find((entry) => entry.id === messageId);
        if (localMessage) {
            setMessage(localMessage);
        }
    }, [allThings?.messages, messageId]);

    useEffect(() => {
        void loadMessage();
    }, [loadMessage]);

    useEffect(() => {
        if (!gateway?.baseURL || !message || message.read) {
            return;
        }

        const markRead = async () => {
            try {
                await markMessageAsRead(gateway, message.id);
                const nextMessage = {
                    ...message,
                    read: true
                };
                setMessage(nextMessage);
                persistMessage(nextMessage);
            } catch {
                setError("Nachricht konnte nicht als gelesen markiert werden.");
            }
        };

        void markRead();
    }, [gateway, message, persistMessage]);

    const presentation = useMemo(() => {
        return message ? determineTitleAndDescription(message) : undefined;
    }, [message]);

    if (!messageId) {
        return (
            <AppScreen title="Nachricht" subtitle="Nachrichten-ID fehlt.">
                <ErrorBanner message="Nachrichten-ID fehlt."/>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                    void loadMessage();
                }}/>}
                showsVerticalScrollIndicator={false}
            >
                <ModernHero
                    title={presentation?.title ?? "Nachricht"}
                    subtitle="Detailansicht einer Systemnachricht."
                    badges={[
                        {
                            label: message?.read ? "Gelesen" : "Ungelesen",
                            icon: <MaterialCommunityIcons size={12} color="white" name={message?.read ? "check-circle-outline" : "bell-outline"}/>
                        },
                        {
                            label: message ? formatTime(message.timestamp) : "-",
                            icon: <MaterialCommunityIcons size={12} color="white" name="clock-outline"/>
                        }
                    ]}
                    stats={[
                        {label: "Typ", value: message?.type ?? "-"},
                        {label: "Status", value: message?.read ? "Gelesen" : "Ungelesen"},
                        {label: "Zeit", value: message ? formatTime(message.timestamp) : "-"},
                        {label: "Quelle", value: message?.namespace ?? "Livisi"}
                    ]}
                />

                {error ? <ErrorBanner message={error}/> : null}

                <ModernSection
                    title="Beschreibung"
                    description="Aufbereitete Meldung"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="text-box-outline"/>}
                    style={{marginBottom: 14}}
                >
                    <Text style={styles.descriptionText}>
                        {presentation?.description ?? "Keine Beschreibung verfuegbar."}
                    </Text>
                </ModernSection>

                <ModernSection
                    title="Raw JSON"
                    description="Technische Nachrichtendaten"
                    icon={<MaterialCommunityIcons size={18} color={Colors.app.primary} name="code-json"/>}
                    style={{marginBottom: 14}}
                >
                    <Text style={styles.rawJsonText}>{JSON.stringify(message, null, 2)}</Text>
                </ModernSection>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    descriptionText: {
        color: Colors.app.text,
        lineHeight: 22
    },
    rawJsonText: {
        color: Colors.app.text,
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 18
    }
});
