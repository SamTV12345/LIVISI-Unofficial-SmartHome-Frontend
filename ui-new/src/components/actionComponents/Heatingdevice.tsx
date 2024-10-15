import {Device} from "@/src/models/Device.ts";
import {FC, useMemo, useState} from "react";
import {Thermometer} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import axios from "axios";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from '@/src/constants/FieldConstants.ts';
import {CURRENT_TEMPERATURE, HEATING_TEMPERATURE, HUMIDITY, isHEATING} from "@/src/constants/StaticChecks.ts";

type HeatingdeviceProps = {
    device: Device
}

export const Heatingdevice: FC<HeatingdeviceProps> = ({device}) => {
    const devMap = useMemo(()=>{
        const devMap = new Map<string, CapabilityState>()
        for (const devState of device.capabilityState!) {
            if (!devState.state) {
                continue
            }

            if ("setpointTemperature" in devState.state && devState.state.setpointTemperature) {
                devMap.set(HEATING_TEMPERATURE, devState)
            } else if ("temperature" in devState.state && devState.state.temperature) {
                devMap.set(CURRENT_TEMPERATURE, devState)
            } else if ("humidity" in devState.state && devState.state.humidity) {
                devMap.set(HUMIDITY, devState)
            }
        }
        return devMap
    }, [device])

    const [currentTemperature, setTemperature] = useState<number>(()=>{
        return devMap.get(HEATING_TEMPERATURE)!.state!.setpointTemperature.value as number
    })


    const constructHeatingModel = (newState: CapabilityState) => {
        return {
            target: CAPABILITY_PREFIX+newState.id,
            type: "SetState",
            namespace: "core."+device.manufacturer,
            params: {
                setpointTemperature: {
                    type: "Constant",
                    value: Number(currentTemperature)
                }
            }
        }
    }

    const updatePointTemperature = async () => {
        const heatingModel = constructHeatingModel(devMap.get(HEATING_TEMPERATURE)!)
        axios.post(ACTION_ENDPOINT, heatingModel)
            .then(() => {
                //mapOfStates.get(CAPABILITY_PREFIX + state.id).state.setpointTemperature.value = currentTemperature
                 device.capabilityState!.find(state => state.id === devMap.get(HEATING_TEMPERATURE)!.id)!.state.setpointTemperature.value = currentTemperature
            })
    }

    useDebounce(() => {
        updatePointTemperature()
    }, 2000, [currentTemperature])

    return <Card key={device.id} className="">
        <CardHeader>
            <CardTitle className="text-xl">{device.config.name}</CardTitle>
            {device.locationData && <CardDescription>{device.locationData?.config.name}</CardDescription>}
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-[auto_1fr] mb-2">
                <div className="w-10 p-2">
                    {isHEATING(device) && <Thermometer/>}
                </div>
                <div>
                    <div className="grid grid-cols-[auto_1fr]">
                        <div className="static">
                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                                {
                                    <>
                                        <div>Zieltemperatur:</div>
                                        <div>{currentTemperature}°C</div>
                                        <div>Temperatur:</div>
                                        <div>{devMap.get(CURRENT_TEMPERATURE)?.state!.temperature.value}°C</div>
                                        <div>Luftfeuchtigkeit:</div>
                                        <div>{devMap.get(HUMIDITY)?.state!.humidity.value}%</div>
                                    </>
                                }
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <div className="static">
                <SliderCDN max={30} min={6.5} step={0.5} value={[currentTemperature || 0]} onValueChange={v => {
                    setTemperature(v[0])
                }}/>
            </div>
        </CardContent>
    </Card>
}
