import {DeviceConfiguration} from "./DeviceConfiguration";

export interface Device {
    id: string,
    manufacturer: string,
    version: string,
    product: string,
    serialNumber: string,
    type: string,
    config: DeviceConfiguration,
    capabilities: string[],
    location: string
}