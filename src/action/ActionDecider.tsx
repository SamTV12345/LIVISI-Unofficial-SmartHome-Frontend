import {Device} from "../models/Device";
import {FC} from "react";
import {CapabilityState} from "../models/CapabilityState";
import {Switch} from "./Switch";
import {HeatingActions} from "./HeatingActions";
import {useTranslation} from "react-i18next";

interface ActionDeciderProps {
    device: Device,
    capabiltyStates: CapabilityState[]
}

export const ActionDecider: FC<ActionDeciderProps> = ({device,capabiltyStates})=>{
    const {t} = useTranslation()

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
    return <div>{t('noSensors')}</div>
}