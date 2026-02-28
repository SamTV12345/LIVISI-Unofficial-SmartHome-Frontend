import {useParams} from "react-router";
import {useContentModel} from "@/src/store.tsx";
import {useEffect, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useNavigate} from "react-router-dom";
import {determineTitleAndDescription, MessageReturnType} from "@/src/utils/messageDetermining.ts";
import axios from "axios";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bell, Clock3, Info} from "lucide-react";
import {formatTime} from "@/src/utils/timeUtils.ts";

export const DetailedMessageScreen = () => {
    const params = useParams()
    const allthings = useContentModel(state => state.allThings)
    const [message, setMessage] = useState<MessageReturnType>()
    const [messageTimestamp, setMessageTimestamp] = useState<string>("")
    const navigate = useNavigate()

    useEffect(() => {
        if (!allthings) return

        const selectedMessage = allthings.messages.find((value) => value.id === params.id)
        if (!selectedMessage) {
            navigate('/404')
            return;
        }

        if (!selectedMessage.read) {
            axios.put("/message/" + selectedMessage.id, {read: true})
                .then(() => {
                    allthings.messages.map((item) => {
                        if (item.id === selectedMessage.id) item.read = true
                        return item
                    })
                })
        }

        setMessage(determineTitleAndDescription(selectedMessage))
        setMessageTimestamp(selectedMessage.timestamp);
    }, [allthings, navigate, params.id]);

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
}
