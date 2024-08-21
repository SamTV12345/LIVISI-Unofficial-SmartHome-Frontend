import {ConfigData} from "@/models/ConfigData";
import {AxiosDeviceResponse, EmailConfig} from "@/store/store";
import ky from "ky";

export const fetchAPIConfig = async (baseURL: string) => {
    return await ky.get<ConfigData>(baseURL + "/api/server").json()
}


export const fetchAPIAll = async (baseURL: string): Promise<AxiosDeviceResponse>=> {
    return await ky.get<AxiosDeviceResponse>(baseURL + "/api/all").json();
}


export const saveEmailSettings = async (baseURL: string, emailConfig: EmailConfig) =>{
    ky.put(baseURL + "/api/server",{
       json: emailConfig,
    })
}
