import React, {FC} from "react";
import {useNavigate} from "react-router-dom";
import {ChevronRight} from "lucide-react";

export type PageBoxProps = {
    children?: React.ReactNode
    title?: string
    description?: string,
    to?: string,
    variant?: "default"|"gray"
}

export const PageBox: FC<PageBoxProps> = ({description,title,children, to, variant})=>{
    const navigate = useNavigate()

    return <div className={`bg-white ${to?'cursor-pointer button-hover':''} box relative ${variant === "gray" && "gray-pagebox"}`} onClick={()=>to && navigate(to)}>
        <div className="p-4">
        <div className="">
            <h2 className="text-xl text-black">{title}</h2>
        </div>
        <div className="text-gray-500">
            {description}
        </div>
        {to&&<ChevronRight className="absolute right-5 top-1/3 text-gray-500"/>}
            {children && title && <div className="mt-2">{children}</div>}
            {children && !title && <div className="">{children}</div>}
        </div>
    </div>
}
