import {ChangeEventHandler, FC} from "react";

type InputProps = {
    value?: string,
    onChange?: ChangeEventHandler<HTMLInputElement>,
    placeholder?: string,
    type?: string,
}


export const Input:FC<InputProps> = ({
    type ="text",onChange,value,placeholder
                                     })=>{
    return <input type={type} onChange={onChange} value={value} placeholder={placeholder} className="border-[1px] rounded-2xl w-full p-2 pl-4 "/>
}
