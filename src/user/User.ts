import {UserData} from "./UserData";

export interface User {
    accountName: string,
    password: string,
    tenantId: string,
    data: UserData
}