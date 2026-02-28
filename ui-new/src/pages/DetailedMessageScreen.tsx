import {useParams} from "react-router";
import {useContentModel} from "@/src/store.tsx";
import {Suspense, useEffect} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useNavigate} from "react-router-dom";
import {determineTitleAndDescription, MessageReturnType} from "@/src/utils/messageDetermining.ts";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bell, Clock3, Info} from "lucide-react";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {Message} from "@/src/models/Messages.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";

const DetailedMessageScreenContent = ({messageId}: {messageId: string}) => {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const navigate = useNavigate();
    const {data: messageResponse} = apiQueryClient.useSuspenseQuery("get", "/message/{message_id}", {
        params: {
            path: {message_id: messageId}
        }
    });
    const selectedMessage = messageResponse as Message;
    const message: MessageReturnType = determineTitleAndDescription(selectedMessage);
    const messageTimestamp = selectedMessage.timestamp;

    useEffect(() => {
        if (!selectedMessage) {
            navigate("/404");
            return;
        }

        if (!selectedMessage.read) {
            openapiFetchClient.PUT("/message/{message_id}", {
                params: {
                    path: {message_id: selectedMessage.id}
                },
                body: {read: true}
            }).then((response) => {
                if (response.error) {
                    return;
                }

                queryClient.setQueryData(
                    apiQueryClient.queryOptions("get", "/message/{message_id}", {params: {path: {message_id: selectedMessage.id}}}).queryKey,
                    {...selectedMessage, read: true}
                );

                const listKey = apiQueryClient.queryOptions("get", "/message").queryKey;
                const cachedList = queryClient.getQueryData(listKey) as Message[] | undefined;
                if (cachedList) {
                    queryClient.setQueryData(listKey, cachedList.map((item) => item.id === selectedMessage.id ? {...item, read: true} : item));
                }

                const currentState = useContentModel.getState().allThings;
                if (currentState) {
                    setAllThings({
                        ...currentState,
                        messages: currentState.messages.map((item) => item.id === selectedMessage.id ? {...item, read: true} : item)
                    });
                }
            });
        }
    }, [navigate, selectedMessage, setAllThings]);

    return <PageComponent title={message?.title || ''} to="/news">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={message?.title ?? "Nachricht"}
                subtitle="Detaillierte Ansicht einer Systemnachricht."
                badges={[
                    {label: "Nachricht", icon: <Bell size={14}/>},
                    {label: messageTimestamp ? formatTime(messageTimestamp) : "-", icon: <Clock3 size={14}/>}
                ]}
                stats={[
                    {label: "Typ", value: "System"},
                    {label: "Status", value: "Gelesen"},
                    {label: "Zeit", value: messageTimestamp ? formatTime(messageTimestamp) : "-"},
                    {label: "Quelle", value: "Livisi"}
                ]}
            />

            <ModernSection title="Nachrichteninhalt" icon={<Info size={18}/>}>
                <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {message?.description}
                </div>
            </ModernSection>
        </div>
    </PageComponent>
};

export const DetailedMessageScreen = () => {
    const params = useParams<{ id: string }>();
    const messageId = params.id;

    if (!messageId) {
        return (
            <PageComponent title="Nachricht" to="/news">
                <div className="space-y-4 p-4 md:p-6">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Nachrichten-ID fehlt.</div>
                </div>
            </PageComponent>
        );
    }

    return (
        <Suspense fallback={<PageSkeleton cards={2}/>}>
            <DetailedMessageScreenContent messageId={messageId}/>
        </Suspense>
    );
};
