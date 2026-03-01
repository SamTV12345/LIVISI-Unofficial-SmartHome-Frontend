import {components} from "@/lib/openapi/schema";
import {formatAsHourMinute} from "@/utils/timeUtils";

type MessageResponse = components["schemas"]["MessageResponseDoc"];

export type MessagePresentation = {
    title: string;
    description: string;
};

export const determineTitleAndDescription = (message: MessageResponse): MessagePresentation => {
    const properties = message.properties;

    switch (message.type) {
        case "DeviceUnreachable":
            return {
                title: "Gerät nicht erreichbar",
                description: `Das Gerät ${properties?.deviceName ?? ""} im Raum ${properties?.deviceLocation ?? ""} ist nicht erreichbar.`
            };
        case "ShcRemoteRebooted":
            return {
                title: "Zentrale neu gestartet",
                description: "Die Zentrale wurde neu gestartet."
            };
        case "LogLevelChanged":
            return {
                title: "Erweiterte Fehlersuche",
                description: `Der Zeitraum für die Aktivitätsaufzeichnung wurde um ${formatAsHourMinute(message.timestamp)} Uhr angefragt und ist für ${properties?.expiresAfterMinutes ?? 0} Minuten aktiv.`
            };
        default:
            return {
                title: message.type || "Unbekannte Nachricht",
                description: "Keine weitere Beschreibung verfügbar."
            };
    }
};
