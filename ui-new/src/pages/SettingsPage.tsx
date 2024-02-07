import {Card} from "@/src/components/layout/Card.tsx";
import {FC, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button} from "@/src/components/actionComponents/Button.tsx";
import axios, {AxiosResponse} from "axios";
import {USBStorage} from "@/src/models/USBStorage.ts";

type SettingsPageProps = {
    name:string,
    to: string
}


const SettingsCard:FC<SettingsPageProps> = ({name,to})=>{
    const navigate = useNavigate()
    return <Card onClick={() => {
        navigate(to)
    }} className="p-2 rounded-none pb-5 pt-5 arrow-mid relative cursor-pointer">{name}</Card>
}

export const SettingsPage = ()=> {
    const navigate = useNavigate()
    const [usbStorage, setUSBStorage] = useState<USBStorage>()
    const logout = ()=>{
        localStorage.removeItem("auth")
        sessionStorage.removeItem("auth")
        navigate("/logincom")
    }

    useEffect(() => {
        getUsbStorage()
    }, []);


    const getUsbStorage = ()=>{
        axios.get("/usb_storage")
            .then((v: AxiosResponse<USBStorage>)=>{
                setUSBStorage(v.data)
            })
    }

    const unmountUSBStorage =()=> {
        axios.get("/unmount")
            .then(()=>setUSBStorage({
                external_storage: false
            }))
    }

    return <div>
        <div className="bg-[#f2f2f0] text-2xl text-blue-500 p-2 rounded border-b-gray-500 border-b-2">Einstellungen</div>
        <SettingsCard name="Gerätetreiber" to="/settings/deviceDrivers"/>
        <SettingsCard name="Gerätestandorte" to="/settings/deviceLocations"/>
        <SettingsCard name="Lokales Zuhause" to="/settings/localHome"/>
        <SettingsCard name="Zentrale" to={"/settings/central"}/>
        <SettingsCard name="Softwareinformationen" to="/settings/softwareInformation"/>
        <SettingsCard name={"Geräteaktivitäten"} to="/settings/deviceActivity"/>
        <SettingsCard name={"Impressum"} to={"/settings/imprint"}/>
        <SettingsCard name={"Netzwerk verwalten"} to={"/settings/network"}/>
        <SettingsCard name={"E-Mail"} to={"/settings/email"}/>

        <div className="ml-5 mr-5">
        <Button className={`w-full h-12 mt-7 uppercase ${!usbStorage?.external_storage&& 'bg-gray-500 hover:bg-gray-500 cursor-auto'}`} onClick={()=>usbStorage?.external_storage&&unmountUSBStorage()}>USB-Stick auswerfen</Button>
        <Button className="w-full h-12 mt-5 uppercase" onClick={logout}>Abmelden</Button>
        </div>
    </div>
}
