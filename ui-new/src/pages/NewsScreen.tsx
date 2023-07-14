import axios, {AxiosResponse} from "axios";
import {Message} from "@/src/models/Messages.ts";
import {useContentModel} from "@/src/store.tsx";
import {useEffect} from "react";

export const NewsScreen = ()=>{

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


    return <div className=" h-full rounded-3xl">

        <div>
            {
                useContentModel.getState().messages.length===0?<div>Keine Nachrichten vorhanden</div>:null
            }
            {useContentModel.getState().messages.map((message)=>{
                return <div key={message.type}>
                    <div>{message.namespace}</div>
                    <div>{message.messages}</div>
                </div>
            })
            }
        </div>

    </div>
}
