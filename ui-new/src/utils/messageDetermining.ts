import {Message} from "@/src/models/Messages.ts";
import {formatAsHourMinute} from "@/src/utils/timeUtils.ts";


export type MessageReturnType = {
    title: string,
    description: string
}

export const determineTitleAndDescription = (message: Message):MessageReturnType=>{
    switch (message.type){
        case "DeviceUnreachable": return  {description: "Das Gerät "+message.properties.deviceName+" im Raum "+ message.properties.deviceLocation+" ist nicht erreichbar", title: "Gerät nicht erreichbar"}
        case "ShcRemoteRebooted": return {description: "Die Zentrale wurde neu gestartet", title: "Zentrale neu gestartet"}
        case "LogLevelChanged": return {description: `Der Zeitraum zum Aufzeichnen der Aktivitäten Ihrer Zentrale wurde geändert, um Fehler besser analysieren zu können. Die Änderung wurde um ${formatAsHourMinute(message.timestamp)} Uhr durch den ${message.properties.requesterInfo} angefordert  und wird für ${message.properties.expiresAfterMinutes} Minuten wirksam sein.`, title: "Erweiterte Fehlersuche"}
        default: return {description: "Unbekannter Fehler", title: "Unbekannter Fehler"}
    }
}
