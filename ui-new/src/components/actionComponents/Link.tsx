import {FC} from "react";

type LinkProps = {
    href: string,
    children?: String

}

export const Link:FC<LinkProps> = ({children,href})=>{
    return <a className="text-green-green" target="_blank" rel="nofollower" href={href}>{children}</a>
}
