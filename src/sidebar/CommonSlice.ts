import { createSlice } from '@reduxjs/toolkit'
import {Device} from "../models/Device";
import {ILocation} from "../models/ILocation";
import {Capability} from "../models/Capability";
import {Message} from "../messages/Message";
import {CapabilityState} from "../models/CapabilityState";

// Define a type for the slice state
interface CommonProps {
    sideBarCollapsed: boolean,
    devices: Device[],
    locations: ILocation[],
    capabilties: Capability[],
    messages: Message[],
    capabilityStates: CapabilityState[]
}

// Define the initial state using that type
const initialState: CommonProps = {
    sideBarCollapsed: false,
    devices: [],
    locations: [],
    capabilties: [],
    messages:[],
    capabilityStates:[]
}

export const commonSlice = createSlice({
    name: 'commonSlice',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setSideBarCollapsed: (state, action)=>{
            state.sideBarCollapsed = action.payload
        },
        setDevices: (state, action)=>{
            state.devices = action.payload
        },
        setLocations: (state, action)=>{
            state.locations = action.payload
        },
        setCapabilities: (state, action)=>{
            state.capabilties = action.payload
        },
        setMessages: (state, action)=>{
            state.messages = action.payload
        },
        setCapabilityStates: (state, action)=>{
            state.capabilityStates = action.payload
        },
        replaceCapabilityState: (state, action)=>{
            const removedState = state.capabilityStates.filter(cp=>!(cp.id === action.payload.id))
            state.capabilityStates = [...removedState, action.payload]
        }
    }
})

export const { setSideBarCollapsed, setDevices, setLocations, setCapabilities, setMessages, setCapabilityStates, replaceCapabilityState  } = commonSlice.actions

export default commonSlice.reducer