import {Device} from "@/src/models/Device.ts";

export type LocationResponse = {
    config: LocationConfig,
    id: string,
    devices?: Device[]
}


type LocationConfig = {
    name: string,
    id: string
}
