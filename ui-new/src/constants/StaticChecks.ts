import {Device} from "@/src/models/Device.ts";
import {HEATING} from "@/src/constants/FieldConstants.ts";

export const isHEATING = (thing: Device): boolean => {
    return thing.type ===  HEATING
}
