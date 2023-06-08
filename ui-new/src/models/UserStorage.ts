import {UserStorageValue} from "@/src/models/UserStorageValue.ts";
import {Device} from "@/src/models/Device.ts";

export type UserStorage = {
    partition: string,
    modifiedTime: string,
    key: string,
    value: UserStorageValue |string,
    devices?: Device[]
}
