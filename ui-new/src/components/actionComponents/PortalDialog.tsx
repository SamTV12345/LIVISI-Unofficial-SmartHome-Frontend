import * as Dialog from "@radix-ui/react-dialog";
import {FC, ReactNode} from "react";
import {X} from "lucide-react";
import {cn} from "@/src/utils/cn-helper.ts";

type PortalDialogProps = {
    deviceDialogOpen: boolean
    setDeviceDialogOpen: (value: boolean) => void,
    children?: ReactNode,
    title?: string,
    description?: string
    className?: string
}

export const PortalDialog:FC<PortalDialogProps> = ({deviceDialogOpen,className,setDeviceDialogOpen, children, description,title}) => {
    return <Dialog.Root open={deviceDialogOpen}>
        <Dialog.Portal>
            <Dialog.Overlay className={cn( "bg-black opacity-30 fixed inset-0",className)} />
            <Dialog.Content className="dialog-centered-content">
                <button className="absolute right-1 top-1" onClick={()=>{
                    setDeviceDialogOpen(false)
                }}><X/></button>
                <Dialog.Title className="DialogTitle text-xl">{title}</Dialog.Title>
                <Dialog.Description></Dialog.Description>
                {description&&<Dialog.Description className="DialogDescription text-sm text-gray-500">
                    {description}
                </Dialog.Description>
                }
                {children}
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}
