import {StateInfo} from "./StateInfo";
import {BooleanStateInfo} from "./BooleanStateInfo";

export interface CapabilityStateItem  {
    onState: BooleanStateInfo //Switch
    pointTemperature?: StateInfo //Expected
    temperature?: StateInfo //Current
    frostWarning?: StateInfo //Frost warning
    windowReductionActive?: StateInfo
    operationMode?: StateInfo
    humidity?: StateInfo
    moldWarning?: StateInfo
}