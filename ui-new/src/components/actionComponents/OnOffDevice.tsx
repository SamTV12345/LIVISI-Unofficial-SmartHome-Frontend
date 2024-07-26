import {Device} from "@/src/models/Device.ts";
import {FC, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Card, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import axios from "axios";
import {ACTION_ENDPOINT} from "@/src/constants/FieldConstants.ts";
import {Power} from 'lucide-react'
import {useNavigate} from "react-router-dom";


type HeatingdeviceProps = {
    device: Device,
    showRoom: boolean
}

export const OnOffDevice:FC<HeatingdeviceProps> = ({device, showRoom=false}) => {
    const mapOfLocations = useContentModel(state => state.mapOfLocations)
    const [turnedOn, setTurnedOn] = useState<boolean>(()=>{
        return device.capabilityState![0].state.onState.value
    })
    const navigate = useNavigate()

    const constructSwitchPostModel = (newStatus: CapabilityState)=>{
        return {
            id: newStatus.id,
            target:"/capability/"+newStatus.id,
            namespace: device.product,
            type: "SetState",
            params:{
                onState:{
                    type:"Constant",
                    value:  turnedOn
                }
            }
        }
    }

    useDebounce(()=>{
            const switchModel = constructSwitchPostModel(device.capabilityState![0])
            axios.post(ACTION_ENDPOINT,switchModel)
                .then(()=>{
                    console.log('Switched')
                })
    },200,[turnedOn])

    return <Card key={device.id} onClick={()=>{
        navigate('/devices/'+device.id)
    }}>
        <CardHeader className="flex flex-row">
            <CardTitle className="text-xl mt-3">{device.config.name}</CardTitle>
            {showRoom&&<CardDescription>{mapOfLocations.get(device.location.replace('/location/',''))?.config.name}</CardDescription>}
            <span className="flex-1"></span>
                <Power className={`rounded-full cursor-pointer border-gray-500 border-2 h-12 w-12 p-2 ${turnedOn?'bg-amber-300':''}`}  onClick={(e)=>{
                    e.stopPropagation()
                    setTurnedOn(!turnedOn)}}/>
        </CardHeader>
    </Card>
}
