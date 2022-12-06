import {CapabilityState} from "../models/CapabilityState";
import {FC, useState} from "react";
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {replaceCapabilityState} from "../sidebar/CommonSlice";
import {Device} from "../models/Device";
import {PostSwitchResponse} from "../models/PostModels/PostSwitchResponse";
import axios from "axios";
import {serverurl} from "../main";

interface SliderProps {
    state: CapabilityState,
    device: Device
}


export const Slider:FC<SliderProps> = ({state, device})=>{
    const dispatch = useAppDispatch()
    const [currentCapability, setCurrentCapability] = useState<CapabilityState>(state)
    const accessToken = useAppSelector(state=>state.loginReducer.accesstoken)

    function constructHeatingModel(newState: CapabilityState) {
        return {
            target: "/capability/" + state.id,
            type: "SetState",
            namespace: device.product,
            params: {
                pointTemperature: {
                    type: "Constant",
                    value: Number(newState.state.pointTemperature?.value)
                }
            }
        }
    }

    const updatePointTemperature = async(newState: CapabilityState)=>{
        const response: PostSwitchResponse = await new Promise<PostSwitchResponse>(resolve=>{
            axios.post(serverurl+"/action",constructHeatingModel(newState),{
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
         console.log();
    }

    return <>
            <div className="col-span-2" key="slider-val">{state.state.pointTemperature?.value}°C</div>
            <input type="range" value={state.state.pointTemperature?.value} min="6" max="30" step={0.5} disabled={false} key="slider"
                   onChange={v => {
                       const clonedState = structuredClone(state)
                       if(clonedState.state.pointTemperature === undefined){
                           return
                       }
                       clonedState.state.pointTemperature.value = v.target.value;
                       setCurrentCapability(clonedState)
                       dispatch(replaceCapabilityState(clonedState));
                   }}
                   onMouseUp={()=>{
                       updatePointTemperature(currentCapability)
                   }
                   }
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 col-span-2"/>
        </>
        }
