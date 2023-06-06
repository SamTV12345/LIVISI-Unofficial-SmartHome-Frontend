import {Device} from "@/src/models/Device.ts";
import {ZWISCHENSTECKER} from "@/src/constants/FieldConstants.ts";

export const isZwischenstecker = (thing: Device): boolean => {
    return thing.type ===  ZWISCHENSTECKER
}
