import {FC, Fragment} from "react";
import {Slider} from "./Slider";
import {CapabilityState} from "../models/CapabilityState";
import {Device} from "../models/Device";

interface HeatingActionsProps {
    state: CapabilityState,
    device: Device
}

export const HeatingActions: FC<HeatingActionsProps>=({state,device})=>{
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
        return <Slider key={state+"pointTemperature"} state={state} device={device}/>
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