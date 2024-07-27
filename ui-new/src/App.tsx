import './App.css'
import {LinkNav} from "./components/navigation/Link.tsx";
import {Outlet, useLocation} from "react-router";
import {useEffect} from "react";
import axios, {AxiosResponse} from "axios";
import {AxiosDeviceResponse, useContentModel} from "@/src/store.tsx";
import {useNavigate} from "react-router-dom";
import logo from './assets/livisi-logo.png'

function App() {
    const location = useLocation()

    const navigate = useNavigate()

    useEffect(() => {
        axios.get("/api/all")
            .then((v: AxiosResponse<AxiosDeviceResponse>) => {
                useContentModel.getState().setAllThings(v.data)
            })
    }, [])


    return <div className="shadow-2xl" id='content'>
        <div className="h-20 navbar-bar">
            <div className="float-right flex gap-5">
                <button onClick={()=>{
                    navigate('/settings')
                }}>Einstellungen</button>
                <button className={location.pathname.includes('help')?'text-blue-500':''} onClick={()=>{
                    navigate('/help')
                }}>Hilfe</button>
            </div>
            <div className="flex header mb-5">
                <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
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
