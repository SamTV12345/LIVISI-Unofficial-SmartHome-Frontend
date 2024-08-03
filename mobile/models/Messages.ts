export type MessageType = {
    id: string,
    class: string,
    namespace: string,
    timestamp: string,
    read: boolean,
    devices?: string[],
    messages?: string[],
    capabilities?: string[]
}


type DeviceUnreachable = MessageType & {
    type: 'DeviceUnreachable',
    properties: {
        deviceLocation: string,
        deviceName: string,
        deviceSerial: string,
        namespace: string,
        requesterInfo: string
    }
}

type ShcRemoteReboot = MessageType & {
    type: 'ShcRemoteRebooted',
    properties: {
        shcRemoteRebootReason: string,
    }
}

export type Message = DeviceUnreachable | ShcRemoteReboot
