import {Device} from "@/src/models/Device.ts";
import {HEATING} from "@/src/constants/FieldConstants.ts";

export const isHEATING = (thing: Device): boolean => {
    return thing.type ===  HEATING
}



export const HEATING_TEMPERATURE = "setpointTemperature"
export const CURRENT_TEMPERATURE = "temperature"
export const HUMIDITY = "humidity"
