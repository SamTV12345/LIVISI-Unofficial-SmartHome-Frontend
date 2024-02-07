import {Device} from "@/src/models/Device.ts";
import {FC, useEffect, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Card, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import axios from "axios";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";
import {Power} from 'lucide-react'


type HeatingdeviceProps = {
    device: Device,
    showRoom: boolean
}

export const OnOffDevice:FC<HeatingdeviceProps> = ({device, showRoom=false}) => {
    const mapOfLocations = useContentModel(state => state.mapOfLocations)
    const mapOfStates = useContentModel(state => state.mapOfStates)
    const [turnedOn, setTurnedOn] = useState<boolean>()
    const [state, setState] = useState<CapabilityState>()

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

    useEffect(()=>{
        device.capabilities.forEach(c=>{
            const currentState = mapOfStates.get(c)
            if(currentState && currentState.state &&currentState.state.onState){
                setState(currentState)
                setTurnedOn(currentState.state.onState.value as boolean)
            }
        })
    },[device])


    useDebounce(()=>{
        if(state){
            const switchModel = constructSwitchPostModel(state)
            axios.post(ACTION_ENDPOINT,switchModel)
                .then(()=>{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    mapOfStates.get(CAPABILITY_PREFIX+state.id).state.onState.value = turnedOn
                })
        }
    },2000,[turnedOn])

    return <Card key={device.id} onClick={()=>{setTurnedOn(!turnedOn)}}>
        <CardHeader className="flex flex-row">
            <CardTitle className="text-xl mt-3">{device.config.name}</CardTitle>
            {showRoom&&<CardDescription>{mapOfLocations.get(device.location.replace('/location/',''))?.config.name}</CardDescription>}
            <span className="flex-1"></span>
                <Power className={`rounded-full border-gray-500 border-2 h-12 w-12 p-2 ${turnedOn?'glowing-white':''}`}/>
        </CardHeader>
    </Card>
}
