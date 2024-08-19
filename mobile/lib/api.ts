import {ConfigData} from "@/models/ConfigData";
import {AxiosDeviceResponse, EmailConfig} from "@/store/store";
import ky from "ky";

export const fetchAPIConfig = async (baseURL: string) => {


    const result = await fetch(baseURL + "/api/server");
    console.log("Result is", result)
    if (result.status != 200) {
        throw new Error("Error retrieving data")
    }

    return await result.json() as Promise<ConfigData>
}


export const fetchAPIAll = async (baseURL: string): Promise<AxiosDeviceResponse>=> {
    return await ky.get<AxiosDeviceResponse>(baseURL + "/api/all").json();
}


export const saveEmailSettings = async (baseURL: string, emailConfig: EmailConfig) =>{
    ky.put(baseURL + "/api/server",{
       json: emailConfig
    })
}
