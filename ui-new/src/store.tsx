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

interface ContentModelState {
    mapOfStates: Map<string, CapabilityState>
    devices: Device[]|undefined,
    setDevices: (devices: Device[]) => void,
    mapOfDevices: Map<string, Device[]>
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
    deviceIdMap: new Map<string, Device>(),
    userStorage: new Map<string, UserStorage>(),
    setDevices: (devices: Device[]) => {
        set(()=>({
            devices: devices
        }))
    },
    devices: undefined,
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
