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

// Friendly names for the product/app install messages (matches the official
// LIVISI app). Unknown products fall back to their raw identifier.
const PRODUCT_NAMES: Record<string, string> = {
    "CosipDevices.RWE": "innogy Geräte",
    "StorageControl.RWE": "Storage Control"
};

const getProductName = (raw: string): string => PRODUCT_NAMES[raw] ?? raw;

export const determineTitleAndDescription = (message: Message):MessageReturnType=>{
    const properties = message.properties;
    switch (message.type){
        case "DeviceUnreachable": return  {description: "Das Gerät " + getStringProperty(properties, "deviceName") + " im Raum " + getStringProperty(properties, "deviceLocation") + " ist nicht erreichbar", title: "Gerät nicht erreichbar"}
        case "DeviceLowBattery": return {description: "Die Batterie des Geräts " + getStringProperty(properties, "deviceName") + " im Raum " + getStringProperty(properties, "deviceLocation") + " ist schwach", title: "Batterie schwach"}
        case "ShcRemoteRebooted": return {description: "Die Zentrale wurde neu gestartet", title: "Zentrale neu gestartet"}
        case "LogLevelChanged": return {description: `Der Zeitraum zum Aufzeichnen der Aktivitäten Ihrer Zentrale wurde geändert, um Fehler besser analysieren zu können. Die Änderung wurde um ${formatAsHourMinute(message.timestamp)} Uhr durch den ${getStringProperty(properties, "requesterInfo")} angefordert  und wird für ${getNumberProperty(properties, "expiresAfterMinutes")} Minuten wirksam sein.`, title: "Erweiterte Fehlersuche"}
        case "ProductInstalled": {
            const name = getProductName(getStringProperty(properties, "productType"));
            return {description: `${name} kann ab jetzt in Ihrem SmartHome genutzt werden`, title: `Installiert: ${name}`};
        }
        case "AppAddedToShc": {
            const name = getProductName(getStringProperty(properties, "appName"));
            return {description: `${name} kann ab jetzt in Ihrem SmartHome genutzt werden`, title: `${name} freigeschaltet`};
        }
        case "ProductUninstalled": {
            const name = getProductName(getStringProperty(properties, "productType"));
            return {description: `"${name}" und alle dazugehörigen Funktionen wurde von Ihrem SmartHome entfernt. Falls Sie "${name}" in Ihren Szenarien verwendet haben, werden diese ggf. als unvollständig angezeigt und verhalten sich anders als zuvor.`, title: `Gelöscht: ${name}`};
        }
        default: return {description: "Unbekannter Fehler", title: "Unbekannter Fehler"}
    }
}
