import React, {FC} from "react";

type PrimaryButtonProps = {
    children: React.ReactNode
    onClick: ()=>void
    className?: string
    disabled?: boolean,
    filled?: boolean,
    status?: "success"|"error"|"warning"
}


export const PrimaryButton:FC<PrimaryButtonProps> = ({disabled, onClick,className, status,children, filled})=>{
    const getStatusColor = ()=>{
        let colorString = ""
        switch (status){
            case "success":
                colorString += "bg-green-green border-green-green border-[1px]"
                break
            case "error":
                colorString += "submit-button-error"
                break
            case "warning":
                colorString+="bg-yellow-yellow"
                break
            default:
                colorString+="bg-green-green border-green-green border-[1px]"
                break
        }
        if (filled) {
            colorString += " text-white"
        } else {
            colorString +=" text-green-green bg-transparent"
        }
        return colorString
    }

    return <button disabled={disabled} onClick={onClick}
                   className={` ${getStatusColor()} ${disabled?"cursor-not-allowed button-disabled":""} text- uppercase text-xl  font-medium  text-center w-full pt-2 pb-2
                     ${className}`}>{children}</button>
}
