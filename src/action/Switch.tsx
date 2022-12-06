import {FC, LegacyRef, useRef} from "react";
import {CapabilityState} from "../models/CapabilityState";
import {replaceCapabilityState, setDevices} from "../sidebar/CommonSlice";
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {Device} from "../models/Device";
import axios from "axios";
import {serverurl} from "../main";
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
    const ref = useRef()

    const switchState = (checked:boolean, element: HTMLElement )=>{
            element.classList.remove("hidden")
            const clonedCapabilityState = structuredClone(capabilityState)
            clonedCapabilityState.state.onState.value = checked
            dispatch(replaceCapabilityState(clonedCapabilityState))
            updateStatus(clonedCapabilityState, element)
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


    const updateStatus = async (clonedStatus: CapabilityState, element: HTMLElement)=>{
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
            element.classList.add("hidden")
            console.log(response)
        }
    }

    return  <div>
        <svg className="animate-spin hidden float-left -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" ref={ref as unknown as LegacyRef<SVGSVGElement>}
             viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <label htmlFor={capabilityState.id+"-toggle"} className="inline-flex relative items-center cursor-pointer">
            <input type="checkbox" id={capabilityState.id+"-toggle"}  className="sr-only peer" checked={capabilityState.state.onState.value} onChange={(c)=>{
                switchState(c.target.checked, ref.current as unknown as HTMLElement)
            }
            }/>
            <div
                className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
    </div>
}
