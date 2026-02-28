import {Message} from "@/src/models/Messages.ts";
import {formatAsHourMinute} from "@/src/utils/timeUtils.ts";


export type MessageReturnType = {
    title: string,
    description: string
}

const getStringProperty = (properties: Record<string, unknown> | undefined, key: string): string => {
    const value = properties?.[key];
    return typeof value === "string" ? value : "";
};

const getNumberProperty = (properties: Record<string, unknown> | undefined, key: string): number => {
    const value = properties?.[key];
    return typeof value === "number" ? value : 0;
};

export const determineTitleAndDescription = (message: Message):MessageReturnType=>{
    const properties = message.properties;
    switch (message.type){
        case "DeviceUnreachable": return  {description: "Das Gerät " + getStringProperty(properties, "deviceName") + " im Raum " + getStringProperty(properties, "deviceLocation") + " ist nicht erreichbar", title: "Gerät nicht erreichbar"}
        case "ShcRemoteRebooted": return {description: "Die Zentrale wurde neu gestartet", title: "Zentrale neu gestartet"}
        case "LogLevelChanged": return {description: `Der Zeitraum zum Aufzeichnen der Aktivitäten Ihrer Zentrale wurde geändert, um Fehler besser analysieren zu können. Die Änderung wurde um ${formatAsHourMinute(message.timestamp)} Uhr durch den ${getStringProperty(properties, "requesterInfo")} angefordert  und wird für ${getNumberProperty(properties, "expiresAfterMinutes")} Minuten wirksam sein.`, title: "Erweiterte Fehlersuche"}
        default: return {description: "Unbekannter Fehler", title: "Unbekannter Fehler"}
    }
}
