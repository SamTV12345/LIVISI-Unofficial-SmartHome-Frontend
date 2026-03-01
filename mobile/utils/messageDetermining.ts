import {Message} from "@/models/Messages";
import {formatAsHourMinute} from "@/utils/timeUtils";

export type MessagePresentation = {
    title: string;
    description: string;
};

const readString = (properties: Record<string, unknown> | undefined, key: string): string => {
    const value = properties?.[key];
    return typeof value === "string" ? value : "";
};

const readNumber = (properties: Record<string, unknown> | undefined, key: string): number => {
    const value = properties?.[key];
    return typeof value === "number" ? value : 0;
};

export const determineTitleAndDescription = (message: Message): MessagePresentation => {
    const properties = message.properties;

    switch (message.type) {
        case "DeviceUnreachable":
            return {
                title: "Geraet nicht erreichbar",
                description: `Das Geraet ${readString(properties, "deviceName")} im Raum ${readString(properties, "deviceLocation")} ist nicht erreichbar.`
            };
        case "ShcRemoteRebooted":
            return {
                title: "Zentrale neu gestartet",
                description: "Die Zentrale wurde neu gestartet."
            };
        case "LogLevelChanged":
            return {
                title: "Erweiterte Fehlersuche",
                description: `Der Zeitraum fuer die Aktivitaetsaufzeichnung wurde um ${formatAsHourMinute(message.timestamp)} Uhr angefragt und ist fuer ${readNumber(properties, "expiresAfterMinutes")} Minuten aktiv.`
            };
        default:
            return {
                title: message.type || "Unbekannte Nachricht",
                description: "Keine weitere Beschreibung verfuegbar."
            };
    }
};
