import {ConfigData} from "@/models/ConfigData";
import {AxiosDeviceResponse} from "@/store/store";

export const fetchAPIConfig = async (baseURL: string) => {
    const result = await fetch(baseURL + "/api/server");
    if (result.status != 200) {
        throw new Error("Error retrieving data")
    }
    return await result.json() as Promise<ConfigData>
}


export const fetchAPIAll = async (baseURL: string)=> {
    const result = await fetch(baseURL+"/api/all")
    return await result.json() as Promise<AxiosDeviceResponse>
}
