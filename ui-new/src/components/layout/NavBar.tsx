import logo from "@/src/assets/livisi-logo.png";
import {LinkNav} from "@/src/components/navigation/Link.tsx";
import {useLocation} from "react-router";
import {useNavigate} from "react-router-dom";
import {Menu, X} from "lucide-react";
import {useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {cn} from "@/src/utils/cn-helper.ts";
import {useContentModel} from "@/src/store.tsx";

export const NavBar = () => {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const socketConnected = useContentModel((state) => state.socketConnected);
    const unreadMessages = useContentModel((state) => state.allThings?.messages?.filter((message) => !message.read).length ?? 0);
    const navigate = useNavigate();

    const NavLinks = () => {
        return <>
            <LinkNav to={'/home'}>Home</LinkNav>
            <LinkNav to={'/devices'}>Geräte</LinkNav>
            <LinkNav to={'/scenarios'}>Szenarien</LinkNav>
            <LinkNav to={'/services'}>Dienste</LinkNav>
            <LinkNav to={'/states'}>Zustände</LinkNav>
            <LinkNav to={'/news'}>
                <span className="inline-flex items-center gap-2">
                    Nachrichten
                    {unreadMessages > 0 && <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#86b919] px-1 text-xs text-white">{unreadMessages}</span>}
                </span>
            </LinkNav>
        </>
    }

    return <div className="border-b border-cyan-100 bg-white/85 px-4 pb-3 pt-3 backdrop-blur md:px-6">
        <div className="mb-3 hidden items-center gap-4 md:flex">
            <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
            <div className="flex flex-wrap items-center gap-2 text-lg">
                <NavLinks/>
            </div>
            <div className="ml-auto flex items-center gap-4">
                <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-slate-600 lg:flex">
                    <span className={socketConnected ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-red-500"}></span>
                    <span>{socketConnected ? "Live verbunden" : "Offline"}</span>
                </div>
                <button
                    type="button"
                    className={cn("rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-gray-100", location.pathname.includes('settings') && "bg-cyan-100/80 text-cyan-800")}
                    onClick={() => navigate('/settings')}
                >
                    Einstellungen
                </button>
                <button
                    type="button"
                    className={cn("rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-gray-100", location.pathname.includes('help') && "bg-cyan-100/80 text-cyan-800")}
                    onClick={() => navigate('/help')}
                >
                    Hilfe
                </button>
            </div>
        </div>

        <div className="flex items-center justify-between md:hidden">
            <button type="button" className="rounded-lg border border-gray-200 bg-white p-2" onClick={() => setOpen(true)}><Menu/></button>
            <img src={logo} className="w-9" alt="LIVISI Smarthome logo"/>
            <div className="flex items-center gap-2">
                <span className={socketConnected ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-red-500"}></span>
                <span className="text-xs text-slate-600">{socketConnected ? "Live" : "Offline"}</span>
            </div>
        </div>

        <Dialog.Root open={open}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 md:hidden" onClick={() => setOpen(false)}/>
                <Dialog.Content className={cn("fixed left-0 top-0 h-full w-5/6 bg-white p-4 shadow-2xl md:hidden", open ? "drawer-custom" : "drawer-custom-close")}>
                    <Dialog.Title className="mb-4 flex items-center justify-between">
                        <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
                        <button type="button" className="rounded-md border border-gray-200 p-1" onClick={() => setOpen(false)}>
                            <X/>
                        </button>
                    </Dialog.Title>
                    <Dialog.Description/>
                    <div className="flex flex-col gap-2 text-lg" onClick={() => setOpen(false)}>
                        <NavLinks/>
                        <button
                            type="button"
                            className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-left text-sm font-medium text-slate-700"
                            onClick={() => navigate('/settings')}
                        >
                            Einstellungen
                        </button>
                        <button
                            type="button"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm font-medium text-slate-700"
                            onClick={() => navigate('/help')}
                        >
                            Hilfe
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </div>
}
