import {Device} from "@/models/Device";
import {LocationResponse} from "@/models/Location";
import {Message} from "@/models/Messages";
import { create } from "zustand";
import {ConfigData} from "@/models/ConfigData";

type Status = {
    appVersion: string,
    configVersion: number,
    connected: boolean,
    controllerType: string,
    network:{
        backendAvailable: boolean,
        bluetoothHotspotName: string,
        ethCableAttached: boolean,
        ethIpAddress: string,
        ethMacAddress: string,
        hostname: string,
        hotspotActive: boolean,
        inUseAdapter: string,
        wifiActiveSsid: string,
        wifiIpAddress: string,
        wifiMacAddress: string
        wifiSignalStrength: number
        wpsActive: boolean
    }
    osVersion: string,
    serialNumber: string,
    operationStatus: string,
}

export type EmailConfig = {
    server_address: string,
    server_port_number: number,
    email_username: string,
    email_password: string,
    recipient_list: string[]
    notifications_device_unreachable: boolean,
    notification_device_low_battery: boolean,
}

export type AxiosDeviceResponse = {
    devices:{
        [key: string]: Device
    }
    status: Status,
    user_storage: any[],
    locations: LocationResponse[],
    messages: Message[],
    email: EmailConfig
}


interface ContentModelState {
    allThings: AxiosDeviceResponse|undefined
    setAllThings(data: AxiosDeviceResponse): void;
    baseURL: string|undefined,
    setBaseURL (url: string):void,
    setConfig(c: ConfigData):void
    config: ConfigData|undefined
}

export const useContentModel = create<ContentModelState>((set)=>({
    allThings: undefined,
    setAllThings(data: AxiosDeviceResponse) {
        set(()=>({allThings: data}))
    },
    baseURL: undefined,
    setBaseURL: (baseURL)=> {
        set(()=>({baseURL}))
    },
    setConfig: (c)=>{
        set(()=>({config: c}))
    },
    config: undefined
}))