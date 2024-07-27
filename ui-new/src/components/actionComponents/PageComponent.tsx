import React, {FC} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowLeft} from 'lucide-react'

type PageComponentProps = {
    children: React.ReactNode
    to?: string,
    title: string,
    actionButton?: React.ReactNode
}

export const PageComponent: FC<PageComponentProps> = ( {children, to, title, actionButton})=>{
    const navigate = useNavigate()

    return <div className="">
        <div className="flex gap-5 page-header">
            {to&&<button  onClick={()=>to&&navigate(to)}><ArrowLeft className="self-center mt-1"/></button>}
            <h2 className="text-xl text-black">{title}</h2>
            {actionButton&&<><div className="flex-1"></div>
            <div className="self-center">{actionButton}</div></>}
        </div>
        <hr className="w-full navbar-separator"/>
        {children}
    </div>
}
