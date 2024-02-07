import './App.css'
import {LinkNav} from "./components/navigation/Link.tsx";
import {Outlet} from "react-router";
import {useEffect, useMemo} from "react";
import axios, {AxiosResponse} from "axios";
import {Device} from "@/src/models/Device.ts";
import {useContentModel} from "@/src/store.tsx";
import {LocationResponse} from "@/src/models/Location.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {
    CAPABILITY_FULL_PATH,
    CAPABILITY_PREFIX,
    USER_STORAGE_FULL_PATH
} from "@/src/constants/FieldConstants.ts";
import {UserStorage} from "@/src/models/UserStorage.ts";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import {useNavigate} from "react-router-dom";

function App() {
    const devices = useContentModel(state => state.devices)
    const mapOfDevices = useContentModel(state => state.mapOfDevices)
    const capabilityStates = useContentModel(state => state.states)
    const mapOfStates = useContentModel(state => state.mapOfStates)
    const deviceIdMap = useContentModel(state => state.deviceIdMap)
    const loadingComplete = useMemo(() => {
        return devices && capabilityStates && mapOfStates !==undefined && mapOfDevices !==undefined

    }, [devices, capabilityStates,mapOfStates, mapOfDevices])

    const navigate = useNavigate()

    useEffect(() => {
        axios.get("/device")
            .then((v: AxiosResponse<Device[]>) => {
                useContentModel.getState().setDevices(v.data)
                v.data.forEach(device => {
                    deviceIdMap.set(device.id, device)
                })
            })
    }, [])

    useEffect(() => {
        axios.get("/location")
            .then((v: AxiosResponse<LocationResponse[]>) => {
                useContentModel.getState().setLocations(v.data)
            })
    }, [])

    useEffect(() => {
        axios.get(CAPABILITY_FULL_PATH)
            .then((v: AxiosResponse<CapabilityState[]>) => {
                useContentModel.getState().setCapabilityStates(v.data)
            })
    }, [])

    useEffect(() => {
        axios.get(USER_STORAGE_FULL_PATH)
            .then((v: AxiosResponse<UserStorage[]>) => {
                useContentModel.getState().setUserStorage(v.data)
            })
    }, [])

    useEffect(() => {
        if (capabilityStates && mapOfStates.size == 0) {
            capabilityStates.forEach(capState => {
                useContentModel.getState().mapOfStates.set(CAPABILITY_PREFIX + capState.id, capState)
            })
        }
    }, [capabilityStates])

    useEffect(() => {
        if (devices && mapOfDevices.size == 0) {
            devices.forEach(device => {
                if (device.type && mapOfDevices.has(device.type)) {
                    mapOfDevices.get(device.type)?.push(device)
                } else {
                    mapOfDevices.set(device.type, [device])
                }
            })
        }
    }, [devices, mapOfDevices])


    if (!loadingComplete) {
        return <LoadingScreen/>
    }

    return <div className="shadow-2xl p-2" id='content'>
        <div className="h-20">
            <div className="float-right flex gap-5">
                <button onClick={()=>{
                    navigate('/settings')
                }}>Einstellungen</button>
                <button onClick={()=>{
                    navigate('/help')
                }}>Hilfe</button>
            </div>
            <div className="flex header mb-5">
                <div><img src="/livisi-logo.png" className="w-10" alt="LIVISI Smarthome logo"/></div>
                <div className="ml-20 flex gap-10 text-2xl">
                    <LinkNav to={'/home'}>Home</LinkNav>
                    <LinkNav to={'/devices'}>Geräte</LinkNav>
                    <LinkNav to={'/scenarios'}>Szenarien</LinkNav>
                    <LinkNav to={'/services'}>Dienste</LinkNav>
                    <LinkNav to={'/states'}>Zustände</LinkNav>
                    <LinkNav to={'/news'}>Nachrichten</LinkNav>
                </div>
            </div>
        </div>

        <Outlet/>
    </div>
}

export default App
