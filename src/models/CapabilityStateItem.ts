import {StateInfo} from "./StateInfo";

export interface CapabilityStateItem  {
    onState: boolean //Switch
    pointTemperature?: StateInfo //Expected
    temperature?: StateInfo //Current
    frostWarning?: StateInfo //Frost warning
    windowReductionActive?: StateInfo
    operationMode?: StateInfo
    humidity?: StateInfo
    moldWarning?: StateInfo
}