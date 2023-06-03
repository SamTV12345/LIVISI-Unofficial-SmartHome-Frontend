import {Message} from "../messages/Message";

let options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit"
};

export const formatMessage = (message: Message,t: any)=>{

    switch (message.type){
        case 'ShcUpdateCompleted': return t('messageSHCUpdateCompleted')
        case 'LocalAccessActivated':return t('messageLocalAccessActivated', {'ip':message.properties?.IP})
    }
}


export const formatTime = (dateAsString: string)=>{
    // @ts-ignore
    return new Date(dateAsString).toLocaleDateString(navigator.language,options)
}
