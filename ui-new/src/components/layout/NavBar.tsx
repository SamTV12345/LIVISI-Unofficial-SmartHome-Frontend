import logo from "@/src/assets/livisi-logo.png";
import {LinkNav} from "@/src/components/navigation/Link.tsx";
import {useLocation} from "react-router";
import {useNavigate} from "react-router-dom";
import {Menu, X} from "lucide-react";
import {useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {cn} from "@/src/utils/cn-helper.ts";

export const NavBar = ()=> {
    const location = useLocation()
    const [open, setOpen] = useState(false);

    const navigate = useNavigate()


    const NavLinks = ()=>{
        return <>
            <LinkNav to={'/home'}>Home</LinkNav>
            <LinkNav to={'/devices'}>Geräte</LinkNav>
            <LinkNav to={'/scenarios'}>Szenarien</LinkNav>
            <LinkNav to={'/services'}>Dienste</LinkNav>
            <LinkNav to={'/states'}>Zustände</LinkNav>
            <LinkNav to={'/news'}>Nachrichten</LinkNav>
        </>
    }

    return <div className="md:h-20 md:navbar-bar">
        <div className="float-right flex gap-5 pt-2 pr-3">
            <button onClick={() => {
                navigate('/settings')
            }}>Einstellungen
            </button>
            <button className={location.pathname.includes('help') ? 'text-blue-500' : ''} onClick={() => {
                navigate('/help')
            }}>Hilfe
            </button>
        </div>
        <button className="ml-5 mt-5 absolute md:hidden" onClick={()=>{
            setOpen(true)
        }}><Menu/></button>
        <div className="md:flex md:header md:mb-5 hidden md:visible pt-2">
            <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
            <div className="ml-20 flex gap-10 text-2xl">
                <NavLinks/>
            </div>
        </div>
        <Dialog.Root open={open}>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black opacity-30 fixed inset-0 md:hidden md:pointer-events-none" onClick={()=>setOpen(false)}/>
                <Dialog.Content className={cn("fixed top-0 left-0 bg-white h-full w-5/6 md:w-0 md:hidden md:pointer-events-none", open?"drawer-custom": "drawer-custom-close")}>
                    <Dialog.Title className="DialogTitle">
                        <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
                    </Dialog.Title>
                    <Dialog.Description className="DialogDescription">
                    </Dialog.Description>
                    <div className="ml-20 flex gap-10 text-2xl flex-col" onClick={()=>setOpen(false)}>
                        <NavLinks/>
                    </div>
                    <Dialog.Close asChild>
                        <button className="IconButton" aria-label="Close">
                            <X className="absolute top-2 right-2" onClick={()=>{
                                setOpen(false)
                            }}/>
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </div>
}
