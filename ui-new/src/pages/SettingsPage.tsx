import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import axios, {AxiosResponse} from "axios";
import {USBStorage} from "@/src/models/USBStorage.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";

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
        <PageComponent title="Einstellungen">
            <PageBox title="Gerätetreiber" to="/settings/deviceDrivers"/>
            <PageBox title="Gerätestandorte" to="/settings/deviceLocations"/>
            <PageBox title="Lokales Zuhause" to="/settings/localHome"/>
            <PageBox title="Zentrale" to={"/settings/central"}/>
            <PageBox title="Softwareinformationen" to="/settings/softwareInformation"/>
            <PageBox title={"Geräteaktivitäten"} to="/settings/deviceActivity"/>
            <PageBox title={"Impressum"} to={"/settings/imprint"}/>
            <PageBox title={"Netzwerk verwalten"} to={"/settings/network"}/>
            <PageBox title={"E-Mail"} to={"/settings/email"}/>
        </PageComponent>

        <div className="flex flex-col gap-5 m-5">
            <PrimaryButton disabled={!usbStorage?.external_storage} filled onClick={()=>usbStorage?.external_storage&&unmountUSBStorage()}>USB-Stick auswerfen</PrimaryButton>
            <PrimaryButton filled onClick={logout}>Abmelden</PrimaryButton>
        </div>
    </div>
}
