export type CapabilityState = {
    id: string,
    state: LooseObject
}


interface LooseObject {
    [key: string]: CapabilityStateValue
}

export type CapabilityStateValue = {
    value: string|number|boolean,
    lastChanged: string,
}
