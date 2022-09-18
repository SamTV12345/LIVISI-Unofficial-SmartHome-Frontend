import {CapabilityState} from "../models/CapabilityState";
import {FC} from "react";
import {useAppDispatch} from "../store/hooks";
import {replaceCapabilityState} from "../sidebar/CommonSlice";

interface SliderProps {
    state: CapabilityState
}

export const Slider:FC<SliderProps> = ({state})=>{
    const dispatch = useAppDispatch()

    return <>
        <div className="col-span-2" key="slider-val">{state.state.pointTemperature?.value}°C</div>
        <input type="range" value={state.state.pointTemperature?.value} min="6" max="30" disabled={false} key="slider"
               onChange={v => {
                   const clonedState = structuredClone(state);
                   clonedState.state.pointTemperature.value = v.target.value;
                   dispatch(replaceCapabilityState(clonedState));
               }}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 col-span-2"/></>
        }