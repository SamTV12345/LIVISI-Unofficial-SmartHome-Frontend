import {Device} from "@/src/models/Device.ts";
import {FC, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {Siren} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {SirenOff} from "@/src/icons/SirenOff.tsx";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import axios from "axios";
import {ACTION_ENDPOINT} from "@/src/constants/FieldConstants.ts";

type WindowDeviceProps = {
    device: Device,
    showRoom: boolean
}


export const SmokeDetector: FC<WindowDeviceProps> = ({device, showRoom}) => {
    const [isAlarming, setAlarming] = useState<boolean>(() => {
        for (const dev of device.capabilityState ||[]) {
            if (dev.state && dev.state.onState && dev.state.onState.value) {
                return true
            }
        }
        return false
    })
    const [isSmokeDetected] = useState<boolean>(() => {
        for (const dev of device.capabilityState || []) {
            if (dev.state && dev.state.isSmokeAlarm && dev.state.isSmokeAlarm.value) {
                return true
            }
        }
        return false
    })
    const [alarmCap] = useState<CapabilityState|undefined>(() => {
        for (const dev of device.capabilityState!) {
            if (dev.state && dev.state.onState) {
                return dev
            }
        }
        return undefined
    })



    const constructSmokeDetectorPostModel = (newStatus: CapabilityState)=>{
        return {
            id: newStatus.id,
            target:"/capability/"+newStatus.id,
            namespace: device.product,
            type: "SetState",
            params:{
                onState:{
                    type:"Constant",
                    value:  isAlarming
                }
            }
        }
    }

    useDebounce(()=>{
        if (!alarmCap) return
        const switchModel = constructSmokeDetectorPostModel(alarmCap)
        axios.post(ACTION_ENDPOINT,switchModel)
            .then(()=>{
                console.log('Alarm switched')
            })
    },200,[isAlarming])


    const navigate = useNavigate()

    return <Card className="relative" key={device.id} onClick={() => {
        navigate('/devices/' + device.id)
    }}>
        <CardHeader className="flex flex-col">
            <CardTitle className="text-xl mt-3">{device.config.name}</CardTitle>
            {showRoom && <CardDescription>{device.locationData?.config.name}</CardDescription>}
            <span className="absolute right-5 top-1/3">
            {
                isAlarming
                    ? <button title="Alarm ausschalten" onClick={(e)=>{
                        e.stopPropagation()
                        setAlarming(!isAlarming)
                    }}><Siren className="rounded-full cursor-pointer border-gray-500 border-2 h-14 w-14 p-2 bg-red-500"/></button>
                    : <button title="Alarm anschalten"  onClick={(e)=>{
                        e.stopPropagation()
                        setAlarming(!isAlarming)
                    }}><SirenOff
                        className="rounded-full cursor-pointer border-gray-500 border-2 h-14 w-14 p-2 bg-green-500"/></button>
            }
</span>
        </CardHeader>
        <CardContent>
            {
                isSmokeDetected
                    ? <CardDescription className="text-red-500 text-xl">Rauch erkannt</CardDescription>
                    : <CardDescription className="text-green-500 text-xl">Kein Rauch erkannt</CardDescription>
            }
        </CardContent>
    </Card>
}
