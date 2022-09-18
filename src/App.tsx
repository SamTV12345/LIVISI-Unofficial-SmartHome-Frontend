import React, {useEffect, useState} from 'react';
import './App.css';
import {useAppDispatch, useAppSelector} from "./store/hooks";
import {LoginPage} from "./login/LoginPage";
import {SideBar} from "./sidebar/SideBar";
import {Header} from "./header/Header";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Dashboard} from "./dashboard/Dashboard";
import {serverurl} from "./index";
import axios from "axios";
import {Device} from "./models/Device";
import {setCapabilities, setCapabilityStates, setDevices, setLocations} from "./sidebar/CommonSlice";
import {ILocation} from "./models/ILocation";
import {Capability} from "./models/Capability";
import {MessageView} from "./messages/MessageView";
import "./language/i18n"
import {CapabilityState} from "./models/CapabilityState";

function App() {
    const accessToken = useAppSelector(state => state.loginReducer.accesstoken)
    const expiresIn = localStorage.getItem("expires_in")
    const dispatch = useAppDispatch()
    const [requested, setRequested] = useState<boolean>(false)
    const capabilityStates = useAppSelector(state=>state.commonReducer.capabilityStates)

    const loadDevices = async ()=>{
        const devicesInResponse: Device[] = await new Promise<Device[]>(resolve=>{
            axios.get(serverurl+"/device",{
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
        })})
        if(devicesInResponse !== undefined){
            dispatch(setDevices(devicesInResponse))
        }
    }

    const loadLocations = async ()=>{
        const locationsInResponse: ILocation[] = await new Promise<ILocation[]>(resolve=>{
            axios.get(serverurl+"/location",{
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
                })})
        if(locationsInResponse !== undefined){
            dispatch(setLocations(locationsInResponse))
        }
    }

    const loadCapabilities = async ()=>{
        const capabilitiesInResponse: Capability[] = await new Promise<Capability[]>(resolve=>{
            axios.get(serverurl+"/capability",{
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
                })})
        if(capabilitiesInResponse !== undefined){
            dispatch(setCapabilities(capabilitiesInResponse))
        }
    }

    const loadCapabilityStates = async ()=>{
        const capabilitiesInResponse: CapabilityState[] = await new Promise<CapabilityState[]>(resolve=>{
            axios.get(serverurl+"/capability/states",{
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
                })})
        if(capabilitiesInResponse !== undefined){
            dispatch(setCapabilityStates(capabilitiesInResponse))
        }
    }

    useEffect(()=>{
        if(!isAuthInvalid() && !requested){
            setRequested(true)
            loadDevices()
            loadLocations()
            loadCapabilities()
            loadCapabilityStates()
        }
    },[])

    function isAuthInvalid() {
        return !accessToken || !expiresIn || new Date().getTime() / 1000 > Number(expiresIn);
    }

    if (isAuthInvalid()) {
        return <LoginPage/>
    }



    return (
        <BrowserRouter>
        <div className="grid  grid-rows-[auto_1fr] h-full">
                <Header/>
                <SideBar/>
                <div className="md:col-span-5 xs:col-span-6">
                        <Routes>
                            <Route path="/"/>
                            <Route path="/dashboard" element={<Dashboard/>}/>
                            <Route path="/messages" element={<MessageView/>}/>
                        </Routes>
                </div>
        </div>
        </BrowserRouter>
    )
}

export default App;
