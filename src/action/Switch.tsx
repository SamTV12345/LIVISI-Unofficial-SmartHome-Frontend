import {FC} from "react";
import {CapabilityState} from "../models/CapabilityState";
import {replaceCapabilityState, setDevices} from "../sidebar/CommonSlice";
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {Device} from "../models/Device";
import axios from "axios";
import {serverurl} from "../index";
import {PostSwitchResponse} from "../models/PostModels/PostSwitchResponse";
import {PostSwitchModel} from "../models/PostModels/PostSwitchModel";
import uuid from "react-uuid";

interface SwitchProps {
    capabilityState: CapabilityState,
    deviceIn: Device
}

export const Switch:FC<SwitchProps> = ({capabilityState, deviceIn})=>{
    const dispatch = useAppDispatch()
    const accessToken = useAppSelector(state=>state.loginReducer.accesstoken)

    const switchState = (checked:boolean)=>{
            const clonedCapabilityState = structuredClone(capabilityState)
            clonedCapabilityState.state.onState.value = checked
            dispatch(replaceCapabilityState(clonedCapabilityState))
            updateStatus(clonedCapabilityState)
    }

    const constructSwitchPostModel:(cap: CapabilityState)=>PostSwitchModel = (newStatus)=>{
        console.log(capabilityState.id.length)
        console.log()

        return {
            target:"/capability/"+capabilityState.id,
            namespace: deviceIn.product,
            type: "SetState",
            params:{
                onState:{
                    type:"Constant",
                    value:newStatus.state.onState.value
                }
            }
        }
    }


    const updateStatus = async (clonedStatus: CapabilityState)=>{
        const response: PostSwitchResponse = await new Promise<PostSwitchResponse>(resolve=>{
            axios.post(serverurl+"/action",constructSwitchPostModel(clonedStatus),{
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            })
                .then(resp=>resolve(resp.data))
                .catch((error)=>{
                    console.log(error)
                })})
        if(response !== undefined){
            console.log(response)
        }
    }

    return  <div>
        <label htmlFor={capabilityState.id+"-toggle"} className="inline-flex relative items-center cursor-pointer">
            <input type="checkbox" value="" id={capabilityState.id+"-toggle"} className="sr-only peer" checked={capabilityState.state.onState.value} onChange={(c)=>{
                switchState(c.target.checked)
            }
            }/>
            <div
                className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
    </div>
}