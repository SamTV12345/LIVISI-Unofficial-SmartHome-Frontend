import {create} from "zustand";
import {Device} from "@/src/models/Device.ts";
import {LocationResponse} from "@/src/models/Location.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";

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
    setLoadingProgress(progress: number): void;
}


export const useContentModel = create<ContentModelState>((set)=>({
    setDevices: (devices: Device[]) => {
        set(()=>({devices: devices}))
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
    }
}))
