import './App.css'
import {LinkNav} from "./components/navigation/Link.tsx";
import {Outlet} from "react-router";
import {useEffect} from "react";
import axios, {AxiosResponse} from "axios";
import {Device} from "@/src/models/Device.ts";
import {useContentModel} from "@/src/store.tsx";
import {LocationResponse} from "@/src/models/Location.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {CAPABILITY_FULL_PATH, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";

function App() {
    const devices = useContentModel(state => state.devices)
    const mapOfDevices = useContentModel(state => state.mapOfDevices)
    const locations = useContentModel(state => state.locations)
    const mapOfLocations = useContentModel(state => state.mapOfLocations)
    const capabilityStates = useContentModel(state => state.states)

    useEffect(()=>{
        axios.get("/device")
            .then((v:AxiosResponse<Device[]>)=>{
                useContentModel.getState().setDevices(v.data)
                useContentModel.getState().loadingProgress+=1
            })
    },[])

    useEffect(()=>{
        axios.get("/location")
            .then((v:AxiosResponse<LocationResponse[]>)=>{
                useContentModel.getState().setLocations(v.data)
                useContentModel.getState().loadingProgress+=1
            })
    },[])

    useEffect(()=>{
        axios.get(CAPABILITY_FULL_PATH)
            .then((v:AxiosResponse<CapabilityState[]>)=>{
                useContentModel.getState().setCapabilityStates(v.data)
                useContentModel.getState().loadingProgress+=1
            })
    },[])

    useEffect(()=>{
        if(capabilityStates.length>0){
            capabilityStates.forEach(capState=>{
                useContentModel.getState().mapOfStates.set(CAPABILITY_PREFIX+capState.id,capState)
            })
            useContentModel.getState().loadingProgress+=1
        }
    },[capabilityStates])

    useEffect(()=>{
        if (devices.length>0){
            devices.forEach(device=>{
                if(device.type&&mapOfDevices.has(device.type)){
                    mapOfDevices.get(device.type)?.push(device)
                }
                else{
                    mapOfDevices.set(device.type, [device])
                }
            })
            useContentModel.getState().loadingProgress+=1
        }
    },[devices])


    useEffect(()=>{
        if (locations.length>0){
            locations.forEach(location=>{
                mapOfLocations.set("/location/"+location.id,location)
            })
            useContentModel.getState().loadingProgress+=1
        }
    },[locations])

    return <div className="mx-auto w-3/4 shadow-2xl p-2" id='content'>
        <div className="flex header mb-5">
        <div>Logo</div>
        <div className="ml-20 flex gap-10 text-2xl">
            <LinkNav to={'/home'}>Home</LinkNav>
            <LinkNav to={'/devices'}>Geräte</LinkNav>
            <LinkNav to={'/scenarios'}>Szenarien</LinkNav>
            <LinkNav to={'/services'}>Dienste</LinkNav>
            <LinkNav to={'/states'}>Zustände</LinkNav>
            <LinkNav to={'/news'}>Nachrichten</LinkNav>
        </div>
    </div>
        <Outlet />
    </div>
}
export default App
