import {LocationResponse} from "@/src/models/Location.ts";

export interface Device {
    manufacturer: string;
    type: string;
    version: string;
    product: string;
    serialNumber: string;
    config: DeviceConfig,
    capabilities: string[],
    id: string,
    location: string,
    tags: DeviceTags,
    locationData?: LocationResponse
    capabilityData?: CapabilityData[]
    capabilityState?: CapabilityStateDevice[]
}

type CapabilityStateDevice = {
    id: string,
    state:{
    [key: string]: any
    }
}

type CapabilityData = {
    id: string,
    type: string,
    device: string
    config: {
        activityLogActive: boolean,
        name: string,
    }
}


interface DeviceConfig {
    activityLogActive: boolean,
    friendlyName: string,
    modelId: string,
    name: string,
    protocolId: string,
    timeOfAcceptance: string,
    timeOfDiscovery: string,
    underlyingDeviceIds: string[],
}

interface DeviceTags {
    type: string,
    typeCategory: string,
}
