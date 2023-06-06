import {Device} from "@/src/models/Device.ts";
import {FC, useEffect, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Card, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import axios from "axios";
import {ACTION_ENDPOINT} from "@/src/constants/FieldConstants.ts";
type HeatingdeviceProps = {
    device: Device
}

export const OnOffDevce:FC<HeatingdeviceProps> = ({device}) => {
    const mapOfLocations = useContentModel(state => state.mapOfLocations)
    const mapOfStates = useContentModel(state => state.mapOfStates)
    const [turnedOn, setTurnedOn] = useState<boolean>()
    const [state, setState] = useState<CapabilityState>()

    const constructSwitchPostModel = (newStatus: CapabilityState)=>{
        return {
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
            if(currentState&&currentState.state.onState &&currentState.state.onState.value){
                console.log("found")
                setState(currentState)
                setTurnedOn(currentState.state.onState.value as boolean)
            }
        })
    },[])


    useDebounce(()=>{
        if(state){
            const switchModel = constructSwitchPostModel(state)
            axios.post(ACTION_ENDPOINT,switchModel)
                .then(()=>{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    mapOfStates.get(state.id).state.onState.value = turnedOn
                })
        }
    },2000,[turnedOn])

    return <Card key={device.id} className={`cursor-pointer ${turnedOn?'bg-amber-300':''}`} onClick={()=>{setTurnedOn(!turnedOn)}}>
        <CardHeader className="grid place-items-center">
            <CardTitle className="text-xl">{device.config.name}</CardTitle>
            <CardDescription>{mapOfLocations.get(device.location)?.config.name}</CardDescription>
        </CardHeader>
    </Card>
}
