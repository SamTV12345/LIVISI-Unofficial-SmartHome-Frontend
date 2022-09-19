import {FC, Fragment} from "react";
import {Slider} from "./Slider";
import {CapabilityState} from "../models/CapabilityState";
import {Device} from "../models/Device";
import {useTranslation} from "react-i18next";

interface HeatingActionsProps {
    state: CapabilityState,
    device: Device
}

export const HeatingActions: FC<HeatingActionsProps>=({state,device})=>{
    const {t} = useTranslation()

    if(state.state.humidity!== undefined){
        return <Fragment key={state.id}>
        <div key={state.id+"humidity"}>
            {t("humidity")}
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
            {t("temperature")}
            </div>
            <div key="temperature-val">
            {state.state.temperature?.value}°C
        </div>
        </Fragment>
    }
}