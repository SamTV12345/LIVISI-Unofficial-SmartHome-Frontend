import React, {FC} from "react";
import {useNavigate} from "react-router-dom";
import {Check, ChevronRight} from "lucide-react";

export type PageBoxProps = {
    children?: React.ReactNode
    title?: string
    description?: React.ReactNode,
    to?: string,
    variant?: "default"|"gray",
    onClick?: ()=>void,
    selected?: boolean
}

export const PageBox: FC<PageBoxProps> = ({description,title, selected, onClick, children, to, variant})=>{
    const navigate = useNavigate()

    return <div className={`bg-white ${(to||onClick)?'cursor-pointer button-hover':''} box relative ${variant === "gray" && "gray-pagebox"}`} onClick={()=>{
        to && navigate(to)
        onClick && onClick()
    }}>
        <div className="p-4">
        <div className="">
            <h2 className="text-xl text-black">{title}</h2>
        </div>
        <div className="text-gray-500 text-sm">
            {description}
        </div>
        {to&&<ChevronRight className="absolute right-5 top-1/3 text-gray-500"/>}
            {selected && <Check className="absolute right-5 top-1/3 text-gray-500"/>}
            {children && title && <div className="mt-2">{children}</div>}
            {children && !title && <div className="">{children}</div>}

        </div>
    </div>
}
