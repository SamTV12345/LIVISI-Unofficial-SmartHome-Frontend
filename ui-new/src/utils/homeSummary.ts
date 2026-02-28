import {Device} from "@/src/models/Device.ts";

const LIGHTING_TYPES = ["PSS", "PSSO", "ISS", "ISS2"];
const CLIMATE_TYPES = ["VRCC", "WRT"];
const SECURITY_TYPES = ["WSD2"];
const DOOR_WINDOW_TYPES = ["WDS"];
const OUTDOOR_TYPES = ["PSSO"];

export const HOME_SECTION_TYPE_GROUPS = {
    lighting: LIGHTING_TYPES,
    climate: CLIMATE_TYPES,
    security: SECURITY_TYPES,
    doorsWindows: DOOR_WINDOW_TYPES,
    outside: OUTDOOR_TYPES
} as const;

export type HomeSectionSummary = {
    id: "lighting" | "climate" | "security" | "doorsWindows" | "outside",
    title: string,
    subtitle: string,
    colorClass: string,
    deviceCount: number
}

const readBooleanState = (device: Device, key: string): boolean => {
    if (!device.capabilityState) {
        return false;
    }

    for (const capability of device.capabilityState) {
        const stateValue = capability.state?.[key]?.value;
        if (typeof stateValue === "boolean") {
            return stateValue;
        }
    }

    return false;
};

const readNumberState = (device: Device, key: string): number | undefined => {
    if (!device.capabilityState) {
        return undefined;
    }

    for (const capability of device.capabilityState) {
        const stateValue = capability.state?.[key]?.value;
        if (typeof stateValue === "number") {
            return stateValue;
        }
    }

    return undefined;
};

const countByState = (devices: Device[], stateKey: string): number => {
    return devices.filter((device) => readBooleanState(device, stateKey)).length;
};

const getLightingSubtitle = (devices: Device[]): string => {
    if (devices.length === 0) {
        return "Noch keine Geräte installiert";
    }
    const activeCount = countByState(devices, "onState");
    return activeCount > 0 ? `${activeCount} Gerät(e) eingeschaltet` : "Alle Geräte aus";
};

const getClimateSubtitle = (devices: Device[]): string => {
    if (devices.length === 0) {
        return "Noch keine Geräte installiert";
    }

    const temperatures = devices
        .map((device) => readNumberState(device, "temperature"))
        .filter((temp): temp is number => temp !== undefined);

    if (temperatures.length === 0) {
        return "Alles in Ordnung";
    }

    const highTemperature = temperatures.some((temp) => temp > 28);
    const lowTemperature = temperatures.some((temp) => temp < 5);
    if (highTemperature || lowTemperature) {
        return "Auffällige Temperatur erkannt";
    }
    return "Alles in Ordnung";
};

const getSecuritySubtitle = (devices: Device[]): string => {
    if (devices.length === 0) {
        return "Noch keine Geräte installiert";
    }
    const smokeDetected = countByState(devices, "isSmokeAlarm");
    return smokeDetected > 0 ? "Alarm erkannt" : "Alles in Ordnung";
};

const getDoorsSubtitle = (devices: Device[]): string => {
    if (devices.length === 0) {
        return "Noch keine Geräte installiert";
    }
    const openCount = countByState(devices, "isOpen");
    return openCount > 0 ? `${openCount} geöffnet` : "Alle geschlossen";
};

const getOutsideSubtitle = (devices: Device[]): string => {
    if (devices.length === 0) {
        return "Noch keine Geräte installiert";
    }
    const activeCount = countByState(devices, "onState");
    return activeCount > 0 ? `${activeCount} aktiv` : "Alles in Ordnung";
};

export const buildHomeSummary = (deviceMap: Record<string, Device> | undefined): HomeSectionSummary[] => {
    const devices = Object.values(deviceMap ?? {});
    const lightingDevices = devices.filter((device) => LIGHTING_TYPES.includes(device.type));
    const climateDevices = devices.filter((device) => CLIMATE_TYPES.includes(device.type));
    const securityDevices = devices.filter((device) => SECURITY_TYPES.includes(device.type));
    const doorDevices = devices.filter((device) => DOOR_WINDOW_TYPES.includes(device.type));
    const outdoorDevices = devices.filter((device) => OUTDOOR_TYPES.includes(device.type));

    return [
        {
            id: "lighting",
            title: "Beleuchtung",
            subtitle: getLightingSubtitle(lightingDevices),
            colorClass: "bg-[#0f62ac]",
            deviceCount: lightingDevices.length
        },
        {
            id: "climate",
            title: "Klima",
            subtitle: getClimateSubtitle(climateDevices),
            colorClass: "bg-[#1f7386]",
            deviceCount: climateDevices.length
        },
        {
            id: "security",
            title: "Sicherheit",
            subtitle: getSecuritySubtitle(securityDevices),
            colorClass: "bg-[#2f7f6d]",
            deviceCount: securityDevices.length
        },
        {
            id: "doorsWindows",
            title: "Türen & Fenster",
            subtitle: getDoorsSubtitle(doorDevices),
            colorClass: "bg-[#4d9560]",
            deviceCount: doorDevices.length
        },
        {
            id: "outside",
            title: "Draußen",
            subtitle: getOutsideSubtitle(outdoorDevices),
            colorClass: "bg-[#6aa33b]",
            deviceCount: outdoorDevices.length
        }
    ];
};

export const getDevicesForHomeSection = (
    sectionId: HomeSectionSummary["id"],
    deviceMap: Record<string, Device> | undefined
): Device[] => {
    const devices = Object.values(deviceMap ?? {});
    const sectionTypes = HOME_SECTION_TYPE_GROUPS[sectionId];
    return devices.filter((device) => sectionTypes.some((sectionType) => sectionType === device.type));
};
