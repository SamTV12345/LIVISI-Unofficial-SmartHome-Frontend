import {ReactNode} from "react";

export const MainWrapper = ({children}: {children: ReactNode})=>{
    return <div className="grid grid-cols-2 main_page_wrapper">
        {children}
    </div>
}
