import {Device} from "@/src/models/Device.ts";
import {FC, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {DoorOpen, DoorClosed} from "lucide-react";
import {useNavigate} from "react-router-dom";


type WindowDeviceProps = {
    device: Device,
    showRoom: boolean
}


export const WindowContactDevice:FC<WindowDeviceProps> = ({device, showRoom}) => {
    const [isOpen, _] = useState<boolean>(()=>{
        for (const dev of device.capabilityState!){
            if (dev.state && dev.state.isOpen && dev.state.isOpen.value){
                return true
            }
        }
        return false
    })
    const navigate = useNavigate()

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
                    ? <CardDescription className="text-red-500 text-xl">Geöffnet</CardDescription>
                    : <CardDescription className="text-green-500 text-xl">Geschlossen</CardDescription>
            }
        </CardContent>
    </Card>

}
