import {Device} from "../models/Device";
import {FC} from "react";
import {Fragment} from "react";
import {CapabilityState} from "../models/CapabilityState";
import {Slider} from "./Slider";
import {Switch} from "./Switch";

interface ActionDeciderProps {
    device: Device,
    capabiltyStates: CapabilityState[]
}

export const ActionDecider: FC<ActionDeciderProps> = ({device,capabiltyStates})=>{
    switch (device.type){
        case 'PSS':
            return <Switch key={capabiltyStates[0].id} capabilityState={capabiltyStates[0]}/>
        case 'RST': return <div className="grid grid-cols-2">
            {capabiltyStates.map(state=>
                {
                    if(state.state.humidity!== undefined){
                        return <Fragment key={state.id}>
                            <div key={state.id+"humidity"}>
                                Luftfeuchtigkeit
                            </div>
                            <div key={state.id+"humidity-val"}>
                                {state.state.humidity.value}%
                            </div>
                        </Fragment>
                    }
                    else if(state.state.pointTemperature){
                        return <Slider key={state+"pointTemperature"} state={state}/>
                    }
                    else{
                        return <Fragment key={"temperaturefrag"}>
                            <div key="temperature">
                                Temperatur
                            </div>
                            <div key="temperature-val">
                                {state.state.temperature?.value}°C
                            </div>
                        </Fragment>
                    }
                }
            )}
        </div>
    }
    return <div>Keine Sensoren</div>
}