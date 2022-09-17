import { createSlice } from '@reduxjs/toolkit'
import {Device} from "../models/Device";
import {ILocation} from "../models/ILocation";
import {Capability} from "../models/Capability";

// Define a type for the slice state
interface CommonProps {
    sideBarCollapsed: boolean,
    devices: Device[],
    locations: ILocation[],
    capabilties: Capability[]
}

// Define the initial state using that type
const initialState: CommonProps = {
    sideBarCollapsed: false,
    devices: [],
    locations: [],
    capabilties: []
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
        }
    }
})

export const { setSideBarCollapsed, setDevices, setLocations, setCapabilities  } = commonSlice.actions

export default commonSlice.reducer