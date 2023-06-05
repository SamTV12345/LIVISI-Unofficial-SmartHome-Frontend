import {NavLink} from "react-router-dom";
import {FC} from "react";

type LinkProps = {
    to: string
    children: string
}

export const LinkNav:FC<LinkProps> = ({to,children})=>{
    return <NavLink to={to} className="relative before:content-[''] before:absolute before:block before:w-full before:h-[2px]
              before:bottom-0 before:left-0 before:bg-black
              before:hover:scale-x-100 before:scale-x-0 before:origin-top-left
              before:transition before:ease-in-out before:duration-300">
        {children}
    </NavLink>
}
