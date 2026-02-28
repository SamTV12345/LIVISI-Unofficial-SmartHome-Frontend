import {FC} from "react";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import * as Dialog from "@radix-ui/react-dialog";
import {cn} from "@/src/utils/cn-helper.ts";
import {CheckCircle2, CircleX} from "lucide-react";

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
                        <CircleX className="h-20 w-20 self-center text-red-600" strokeWidth={1.6}/>
                        <div className="text-2xl self-center text-red-600">Fehler</div>
                    </>
                    }
                    {
                        status === "success" && <><CheckCircle2 className="h-20 w-20 self-center text-green-green" strokeWidth={1.6}/>
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
