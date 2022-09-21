import {useAppDispatch, useAppSelector} from "../store/hooks";
import {useEffect} from "react";
import axios from "axios";
import {serverurl} from "../index";
import {setMessages} from "../sidebar/CommonSlice";
import {Message} from "./Message";
import {formatMessage, formatTime} from "../utils/FormatMessage";
import {useTranslation} from "react-i18next";

export const MessageView = ()=>{
    const messages = useAppSelector(state=>state.commonReducer.messages)
    const accessToken = useAppSelector(state=>state.loginReducer.accesstoken)
    const dispatch = useAppDispatch()
    const {t} = useTranslation()

    const loadMessages = async ()=>{
        const messagesInResponse: Message[] = await new Promise<Message[]>(resolve=>{
            axios.get(serverurl+"/message",{
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
                })})
        if(messagesInResponse !== undefined){
            dispatch(setMessages(messagesInResponse))
        }
    }

    useEffect(()=>{
        if(messages.length===0){
            loadMessages()
        }
    }, [])

    return (
        <div className="overflow-x-auto relative w-full p-6">
            <table className="w-full text-sm text-left text-gray-800">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400">
                <tr key={"Head"}>
                    <th scope="col" className="py-3 px-6 text-center text-gray-800">{t('message')}</th>
                    <th scope="col" className="py-3 px-6 text-gray-800 text-center">{t('time')}</th>
                </tr>
                </thead>
                <tbody>
                {messages.map(message => <tr key={message.id} className="text-xs text-gray-700 even:bg-gray-100">
                    <td className="py-4 px-6 w-9/12">{formatMessage(message, t)}</td>
                    <td className="py-4 px-6 text-center">{formatTime(message.timestamp)}</td>
                </tr>)}
                </tbody>
            </table>
        </div>
        )
}