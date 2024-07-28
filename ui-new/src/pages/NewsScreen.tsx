import axios, {AxiosResponse} from "axios";
import {Message} from "@/src/models/Messages.ts";
import {useContentModel} from "@/src/store.tsx";
import {useEffect} from "react";
import {Card} from "@/src/components/layout/Card.tsx";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";


type MessageReturnType = {
    title: string,
    description: string
}

export const NewsScreen = ()=>{
    const messages = useContentModel(state=>state.allThings)

    const determineTitleAndDescription = (message: Message):MessageReturnType=>{
        switch (message.type){
            case "DeviceUnreachable": return  {description: "Das Gerät "+message.properties.deviceName+" im Raum "+ message.properties.deviceLocation+" ist nicht erreichbar", title: "Gerät nicht erreichbar"}
            case "ShcRemoteRebooted": return {description: "Die Zentrale wurde neu gestartet", title: "Zentrale neu gestartet"}
            default: return {description: "Unbekannter Fehler", title: "Unbekannter Fehler"}
        }
    }
    const getMessages = ()=>{
        axios.get("/message")
            .then((v:AxiosResponse<Message[]>)=>{
                useContentModel.getState().setMessages(v.data)
            })
    }

    useEffect(()=>{
        if(useContentModel.getState().messages.length===0){
            getMessages()
        }
    },[])


    return <PageComponent title="Nachrichten">

        <div className="p-4">
            {
                messages?.messages.length===0?<div>Keine Nachrichten vorhanden</div>:null
            }
            {messages?.messages.sort((a,b)=>b.timestamp.localeCompare(a.timestamp))
                .map((message)=>{
                const {title, description} = determineTitleAndDescription(message)
                return <Card key={message.id} className="mt-2 p-5 relative">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <div>{description}</div>
                    <span className="absolute right-5 top-[30%]">{formatTime(message.timestamp)}</span>
                </Card>
            })
            }
        </div>

    </PageComponent>
}
