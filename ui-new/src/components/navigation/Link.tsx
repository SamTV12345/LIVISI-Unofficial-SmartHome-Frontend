import {NavLink} from "react-router-dom";
import {FC, ReactNode} from "react";
import {cn} from "@/src/utils/cn-helper.ts";

type LinkProps = {
    to: string
    children: ReactNode
}

export const LinkNav:FC<LinkProps> = ({to,children})=>{
    return <NavLink
        to={to}
        className={({isActive}) => cn(
            "relative rounded-lg px-2 py-1 text-base font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700",
            isActive && "bg-cyan-100/80 text-cyan-800"
        )}
    >
        {children}
    </NavLink>
}
