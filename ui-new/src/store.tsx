import {create} from "zustand";
import {Device} from "@/src/models/Device.ts";
import {LocationResponse} from "@/src/models/Location.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {UserStorage} from "@/src/models/UserStorage.ts";
import {ConfigModel} from "@/src/models/ConfigModel.ts";

export type LoginData = {
    username: string,
    password: string,
    rememberMe: boolean
};

interface ContentModelState {
    mapOfStates: Map<string, CapabilityState>
    devices: Device[],
    setDevices: (devices: Device[]) => void,
    mapOfDevices: Map<string, Device[]>
    setLocations(data: LocationResponse[]): void;
    locations: LocationResponse[],
    mapOfLocations: Map<string, LocationResponse>
    states: CapabilityState[],
    setCapabilityStates(states: CapabilityState[]): void;
    loadingProgress: number,
    setLoadingProgress(progress: number): void
    devicesByLocation: Map<string, Device[]>
    setUserStorage(data: UserStorage[]): void;
    userStorage: Map<string,UserStorage>;
    deviceIdMap: Map<string, Device>,
    loginConfig: ConfigModel|undefined
    setLoginConfig(config: ConfigModel): void,
    loginData: LoginData|undefined,
    setLoginData(data: LoginData): void
}


export const useContentModel = create<ContentModelState>((set)=>({
    deviceIdMap: new Map<string, Device>(),
    userStorage: new Map<string, UserStorage>(),
    setDevices: (devices: Device[]) => {
        set(()=>({
            devices: devices
        }))
    },
    devices: [],
    mapOfDevices: new Map<string, Device[]>,
    setLocations(data: LocationResponse[]) {
        set(()=>({locations: data}))
    },
    locations: [],
    mapOfLocations: new Map<string, LocationResponse>(),
    states: [],
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
    }
}))
