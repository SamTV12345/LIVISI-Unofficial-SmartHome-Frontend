import {useEffect, useMemo, useState} from "react";
import {RefreshControl, ScrollView, StyleSheet, Text, View} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {AppScreen} from "@/components/ui/AppScreen";
import {ModernHero, ModernSection} from "@/components/ui/ModernSurface";
import {ErrorBanner} from "@/components/ErrorBanner";
import {Colors} from "@/constants/Colors";
import {useContentModel} from "@/store/store";
import {determineTitleAndDescription} from "@/utils/messageDetermining";
import {formatTime} from "@/utils/timeUtils";
import {SkeletonBlock, SkeletonCard} from "@/components/ui/Skeleton";
import {useGatewayApi} from "@/hooks/useGatewayApi";

export default function NewsDetailScreen() {
    const {messageId} = useLocalSearchParams<{messageId: string}>();
    const activeMessageId = Array.isArray(messageId) ? messageId[0] : messageId;
    const gateway = useContentModel((state) => state.gateway);
    const gatewayApi = useGatewayApi();

    const {data: message, isError, isFetching, refetch} = gatewayApi.useQuery("get", "/message/{message_id}", {
        params: {path: {message_id: activeMessageId ?? ""}}
    }, {
        enabled: Boolean(gateway?.baseURL && activeMessageId)
    });

    const markReadMutation = gatewayApi.useMutation("put", "/message/{message_id}");
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!message || message.read) return;

        markReadMutation.mutateAsync({
            params: {path: {message_id: message.id}},
            body: {read: true}
        }).then(() => void refetch())
          .catch(() => setError("Nachricht konnte nicht als gelesen markiert werden."));
    }, [message?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const presentation = useMemo(() => {
        return message ? determineTitleAndDescription(message) : undefined;
    }, [message]);

    if (!activeMessageId) {
        return (
            <AppScreen title="Nachricht" subtitle="Nachrichten-ID fehlt.">
                <ErrorBanner message="Nachrichten-ID fehlt."/>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll={false}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => void refetch()}/>}
                showsVerticalScrollIndicator={false}
            >
                {!message && !isError && (
                    <SkeletonCard style={{marginBottom: 14}}>
                        <SkeletonBlock height={30} width="56%"/>
                        <SkeletonBlock height={18} width="74%" style={{marginTop: 10}}/>
                        <View style={{marginTop: 14, flexDirection: "row", gap: 8}}>
                            <SkeletonBlock height={28} width="34%" radius={999}/>
                            <SkeletonBlock height={28} width="34%" radius={999}/>
                        </View>
                    </SkeletonCard>
                )}

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

                {error && <ErrorBanner message={error}/>}
                {isError && <ErrorBanner message="Nachricht konnte nicht geladen werden." onRetry={() => void refetch()}/>}

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
