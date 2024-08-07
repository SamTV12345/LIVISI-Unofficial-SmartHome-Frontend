import {create} from "zustand";
import {Device} from "@/src/models/Device.ts";
import {LocationResponse} from "@/src/models/Location.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {UserStorage} from "@/src/models/UserStorage.ts";
import {ConfigModel} from "@/src/models/ConfigModel.ts";
import {Message} from "@/src/models/Messages.ts";
import {Interaction} from "@/src/models/Interaction.ts";

export type LoginData = {
    username: string,
    password: string,
    rememberMe: boolean
};

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

export type EmailConfig = {
    server_address: string,
    server_port_number: number,
    email_username: string,
    email_password: string,
    recipient_list: string[]
    notifications_device_unreachable: boolean,
    notification_device_low_battery: boolean,
}


interface ContentModelState {
    allThings: AxiosDeviceResponse|undefined
    setAllThings(data: AxiosDeviceResponse): void;
    mapOfStates: Map<string, CapabilityState>
    setLocations(data: LocationResponse[]): void;
    locations: LocationResponse[]|undefined,
    mapOfLocations: Map<string, LocationResponse>
    states: CapabilityState[]|undefined,
    setCapabilityStates(states: CapabilityState[]): void;
    loadingProgress: number,
    setLoadingProgress(progress: number): void
    devicesByLocation: Map<string, Device[]>
    setUserStorage(data: UserStorage[]): void;
    userStorage: Map<string,UserStorage>;
    deviceIdMap: Map<string, Device>,
    interactions: Interaction[]|undefined,
    loginConfig: ConfigModel|undefined
    setLoginConfig(config: ConfigModel): void,
    loginData: LoginData|undefined,
    setLoginData(data: LoginData): void,
    messages: Message[],
    setMessages(data: Message[]): void,
    setInteractions(data: Interaction[]): void
}


export const useContentModel = create<ContentModelState>((set)=>({
    allThings: undefined,
    setAllThings(data: AxiosDeviceResponse) {
        set(()=>({allThings: data}))
    },
    deviceIdMap: new Map<string, Device>(),
    userStorage: new Map<string, UserStorage>(),
    mapOfDevices: new Map<string, Device[]>,
    setLocations(data: LocationResponse[]) {
        set(()=>({locations: data}))
    },
    locations: undefined,
    mapOfLocations: new Map<string, LocationResponse>(),
    states: undefined,
    setCapabilityStates(states: CapabilityState[]) {
        set(()=>({states: states}))
    },
    mapOfStates: new Map<string, CapabilityState>(),
    loadingProgress: 0,
    setLoadingProgress(progress: number) {
        set(()=>({loadingProgress: progress}))
    },
    devicesByLocation: new Map<string, Device[]>(),
    setUserStorage(data: UserStorage[]) {
        data.forEach(d=>{
            this.userStorage.set(d.key,d)
        })
    },
    loginConfig: undefined,
    setLoginConfig(config: ConfigModel) {
        set(()=>({loginConfig: config}))
    },
    loginData: undefined,
    setLoginData(data: LoginData) {
        set(()=>({loginData: data}))
    },
    messages: [],
    setMessages(data: Message[]) {
        set(()=>({messages: data}))
    },
    interactions: undefined,
    setInteractions(data: Interaction[]) {
        set(()=>({interactions: data}))
    }
}))
