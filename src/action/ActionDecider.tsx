import {Device} from "../models/Device";
import {FC} from "react";
import {CapabilityState} from "../models/CapabilityState";
import {Slider} from "./Slider";

interface ActionDeciderProps {
    device: Device,
    capabiltyStates: CapabilityState[]
}

export const ActionDecider: FC<ActionDeciderProps> = ({device,capabiltyStates})=>{
    switch (device.type){
        case 'PSS': return <div>
            <label htmlFor="default-toggle" className="inline-flex relative items-center cursor-pointer">
                <input type="checkbox" value="" id="default-toggle" className="sr-only peer" checked={capabiltyStates[0].state.onState}/>
                    <div
                        className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
        </div>
        case 'RST': return <div className="grid grid-cols-2">
            {capabiltyStates.map(state=>
                {
                    if(state.state.humidity!== undefined){
                        return <>
                            <div key="humidity">
                                Luftfeuchtigkeit
                            </div>
                            <div key="humidity-val">
                                {state.state.humidity.value}%
                            </div>
                        </>
                    }
                    else if(state.state.pointTemperature){
                        return <Slider state={state}/>
                    }
                    else{
                        return <>
                            <div key="temperature">
                                Temperatur
                            </div>
                            <div key="temperature-val">
                                {state.state.temperature?.value}°C
                            </div>
                        </>
                    }
                }
            )}
        </div>
    }
    return <div>Keine Sensoren</div>
}