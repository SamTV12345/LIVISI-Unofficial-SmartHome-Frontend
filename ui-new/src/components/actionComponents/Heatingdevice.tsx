import {Device} from "@/src/models/Device.ts";
import {FC, useState} from "react";
import {Thermometer} from 'lucide-react'
import {useContentModel} from "@/src/store.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import axios from "axios";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from '@/src/constants/FieldConstants.ts';
import {isZwischenstecker} from "@/src/constants/StaticChecks.ts";
type HeatingdeviceProps = {
    device: Device
}

export const Heatingdevice:FC<HeatingdeviceProps> = ({device}) => {
    const mapOfLocations = useContentModel(state => state.mapOfLocations)
    const mapOfStates = useContentModel(state => state.mapOfStates)
    const [currentTemperature, setTemperature] = useState<number>()
    const [state, setState] = useState<CapabilityState>()
    const constructHeatingModel = (newState: CapabilityState)=>{
            return {
                target: CAPABILITY_PREFIX + newState.id,
                type: "SetState",
                namespace: device.product,
                params: {
                    pointTemperature: {
                        type: "Constant",
                        value: Number(currentTemperature)
                    }
                }
        }
    }

    const updatePointTemperature = async()=>{
        if (state==null){
            return
        }
        const heatingModel = constructHeatingModel(state)
            axios.post(ACTION_ENDPOINT,heatingModel)
                .then(()=>{
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        mapOfStates.get(CAPABILITY_PREFIX+state.id).state.pointTemperature.value = currentTemperature
                })
    }

    useDebounce(()=>{
        updatePointTemperature()

    }, 2000,[currentTemperature])

    console.log(device.id)
    return <Card key={device.id} className="">
        <CardHeader>
            <CardTitle className="text-xl">{device.config.name}</CardTitle>
            <CardDescription>{mapOfLocations.get(device.location)?.config.name}</CardDescription>
        </CardHeader>
            <CardContent>
                <div className="grid grid-cols-[auto_1fr] mb-2">
                <div className="w-10 p-2">
                    {isZwischenstecker(device)&&<Thermometer/>}
                </div>
                <div>
                    <div className="grid grid-cols-[auto_1fr]">
                        <div className="static">

                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                        {
                            device.capabilities.map(capability=> {
                                const state = mapOfStates.get(capability)
                                console.log(state)
                                if (state==null){
                                    return <><div></div><div></div></>
                                }

                                if (state.state.pointTemperature) {
                                    if (!currentTemperature){
                                        setTemperature(state.state.pointTemperature.value as number)
                                        setState(state)
                                    }
                                    return <><div>Zieltemperatur:</div><div>{currentTemperature}°C</div></>
                                }
                                else if (state.state.humidity) {
                                    return <><div>Feuchtigkeit:</div><div>{state.state.humidity && state.state.humidity.value}%</div></>
                                }
                                else if (state.state.temperature){

                                    return <><div>Temperatur:</div><div>{state.state.temperature && state.state.temperature.value}°C</div></>
                                }
                                else{
                                    return <><div></div><div></div></>
                                }
                        })
                        }
                            </div>
                        </div>
                    </div>

                </div>
                </div>
                <div className="static">
                    <SliderCDN max={30} min={6.5} step={0.5} value={[currentTemperature||0]} onValueChange={v=>{
                        setTemperature(v[0])
                    }}/>
                </div>
            </CardContent>
    </Card>
}