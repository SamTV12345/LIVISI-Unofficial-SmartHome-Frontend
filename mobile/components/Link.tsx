import {FC} from "react";
import {A} from "@expo/html-elements";

type LinkProps = {
    href?: string
    children?: React.ReactNode
}

export const Link: FC<LinkProps> = ({children,href})=>{
    return <A style={{color: '#0385FF'}} href={href}>{children}</A>
}