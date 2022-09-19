import {Device} from "../models/Device";
import {FC} from "react";
import {Fragment} from "react";
import {CapabilityState} from "../models/CapabilityState";
import {Slider} from "./Slider";
import {Switch} from "./Switch";
import {HeatingActions} from "./HeatingActions";

interface ActionDeciderProps {
    device: Device,
    capabiltyStates: CapabilityState[]
}

export const ActionDecider: FC<ActionDeciderProps> = ({device,capabiltyStates})=>{
    switch (device.type){
        case 'PSS':
            return <Switch key={capabiltyStates[0].id} capabilityState={capabiltyStates[0]} deviceIn={device}/>
        case 'RST': return <div className="grid grid-cols-2">
            {capabiltyStates.map(state=>
                {
                       return <HeatingActions state={state} device={device}/>
                }
            )}
        </div>
    }
    return <div>Keine Sensoren</div>
}