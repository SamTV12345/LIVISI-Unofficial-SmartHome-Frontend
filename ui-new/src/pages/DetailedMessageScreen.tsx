import {useParams} from "react-router";
import {useContentModel} from "@/src/store.tsx";
import {useEffect, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useNavigate} from "react-router-dom";
import {determineTitleAndDescription, MessageReturnType} from "@/src/utils/messageDetermining.ts";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import axios from "axios";

export const DetailedMessageScreen = ()=>{
    const params = useParams()
    const allthings = useContentModel(state=>state.allThings)
    const [message, setMessage] = useState<MessageReturnType>()
    const navigate = useNavigate()

    useEffect(() => {
        if (!allthings) return

        const message = allthings.messages.find(v=>v.id === params.id)

        if (!message) {
            navigate('/404')
            return;
        }


        if(!message.read) {
            axios.put("/message/"+message.id, {
                read: true
            })
                .then(()=>{
                    allthings.messages.map(m=>{
                        if (m.id === message.id){
                            m.read = true
                        }
                        return m
                    })
                })
        }

        const parsedMessage = determineTitleAndDescription(message)
        setMessage(parsedMessage)
    }, [allthings]);


    return <PageComponent title={message?.title!} to="/news">
        <PageBox>
            {message?.description}
        </PageBox>
    </PageComponent>
}
