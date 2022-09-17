import {CapabilityConfiguration} from "./CapabilityConfiguration";

export interface  Capability {
    id: string,
    type: string,
    device: string,
    config: CapabilityConfiguration
}