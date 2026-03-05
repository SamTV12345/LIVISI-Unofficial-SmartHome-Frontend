import {Device} from "@/src/models/Device.ts";
import {FC, useMemo} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {DoorOpen, DoorClosed} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";


type WindowDeviceProps = {
    device: Device,
    showRoom: boolean
}


export const WindowContactDevice:FC<WindowDeviceProps> = ({device, showRoom}) => {
    const isOpen = useMemo(() => {
        for (const capability of device.capabilityState ?? []) {
            if (capability.state?.isOpen?.value === true) {
                return true
            }
        }
        return false
    }, [device.capabilityState])
    const navigate = useNavigate()
    const {t} = useTranslation();

    return <Card className="relative" key={device.id} onClick={()=>{
        navigate('/devices/'+device.id)
    }}>
    <CardHeader className="flex flex-col">
    <CardTitle className="text-xl mt-3">{device.config.name}</CardTitle>
    {showRoom&&<CardDescription>{device.locationData?.config.name}</CardDescription>}
    <span className="absolute right-5 top-1/3">
        {
            isOpen
            ? <DoorOpen className="rounded-full cursor-pointer border-gray-500 border-2 h-14 w-14 p-2 bg-red-500"/>
            : <DoorClosed className="rounded-full cursor-pointer border-gray-500 border-2 h-14 w-14 p-2 bg-green-500"/>
        }
    </span>
    </CardHeader>
        <CardContent>
            {
                isOpen
                    ? <CardDescription className="text-red-500 text-xl">{t("ui_new.window_contact.open")}</CardDescription>
                    : <CardDescription className="text-green-500 text-xl">{t("ui_new.window_contact.closed")}</CardDescription>
            }
        </CardContent>
    </Card>

}
