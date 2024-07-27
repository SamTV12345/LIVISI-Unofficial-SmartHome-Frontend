import {FC} from "react";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import * as Dialog from "@radix-ui/react-dialog";
import {cn} from "@/src/utils/cn-helper.ts";

type AlertDialogProps = {
    open: boolean,
    setOpen: (value: boolean) => void,
    msg?: string
    status: "error"|"success"
}

export const AlertDialog: FC<AlertDialogProps> = ({setOpen,open,msg, status})=>{
    return <Dialog.Root open={open}>
        <Dialog.Portal>
            <Dialog.Overlay className={cn( "bg-white opacity-100 fixed inset-0")} />
            <Dialog.Content  className="shadow-none  bg-white p-5 h-full w-full fixed left-0 grid place-items-center">
                <div className="block w-full">
                <div className="flex justify-center flex-col">
                    {status === "error" && <>
                        <svg className="w-20 self-center" viewBox="0 0 60 60">
                            <use href="/images/sprite.symbol.svg#GR_Icons_System_overlay_error"
                                 className="GR_Icons_System_overlay_error"></use>
                        </svg>
                        <div className="text-green-green text-2xl self-center">Fehler</div>
                    </>
                    }
                    {
                        status === "success" && <><img src="/checkIcon.gif" alt="Checked icon" className="w-20 self-center"/>
                            <div className="text-green-green text-2xl self-center">Erfolgreich</div>
                        </>
                    }
                </div>
                    {status === "error"&&<div className="text-gray-400 mt-20 mb-5">Fehler: {msg}</div>}
                    {status === "success"&&<div className="text-gray-400 mt-20 mb-5">Erfolgreich: {msg}</div>}
                <PrimaryButton className="w-full" filled onClick={() => {
                    setOpen(false)
                }}>Schließen</PrimaryButton>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}
