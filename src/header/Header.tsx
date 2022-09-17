import {setSideBarCollapsed} from "../sidebar/CommonSlice";
import React from "react";
import {useAppDispatch, useAppSelector} from "../store/hooks";

export const Header = ()=>{
    const dispatch = useAppDispatch()
    const sideBarCollapsed = useAppSelector(state=>state.commonReducer.sideBarCollapsed)

    return (
        <div className="bg-neutral-900 w-full col-span-6 auto-rows-min h-12 grid grid grid-cols-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                 onClick={()=>{dispatch(setSideBarCollapsed(!sideBarCollapsed))}}
                 className="h-10 w-10 text-white mt-1 ml-3  focus:animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </div>
    )
}