import logo from "@/src/assets/livisi-logo.png";
import {LinkNav} from "@/src/components/navigation/Link.tsx";
import {useLocation, useNavigate} from "react-router-dom";
import {Menu, X} from "lucide-react";
import {useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {cn} from "@/src/utils/cn-helper.ts";
import {useContentModel} from "@/src/store.tsx";
import {useTranslation} from "react-i18next";

export const NavBar = () => {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const socketConnected = useContentModel((state) => state.socketConnected);
    const unreadMessages = useContentModel((state) => state.allThings?.messages?.filter((message) => !message.read).length ?? 0);
    const navigate = useNavigate();
    const {t} = useTranslation();

    const NavLinks = () => {
        return <>
            <LinkNav to={'/home'}>{t("ui_new.nav.home")}</LinkNav>
            <LinkNav to={'/devices'}>{t("ui_new.nav.devices")}</LinkNav>
            <LinkNav to={'/automation'}>{t("ui_new.nav.automation")}</LinkNav>
            <LinkNav to={'/services'}>{t("ui_new.nav.services")}</LinkNav>
            <LinkNav to={'/states'}>{t("ui_new.nav.states")}</LinkNav>
            <LinkNav to={'/news'}>
                <span className="inline-flex items-center gap-2">
                    {t("ui_new.nav.news")}
                    {unreadMessages > 0 && <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#86b919] px-1 text-xs text-white">{unreadMessages}</span>}
                </span>
            </LinkNav>
        </>
    }

    return <div className="border-b border-cyan-100 bg-white/85 px-4 pb-3 pt-3 backdrop-blur md:px-6 dark:border-cyan-900/40 dark:bg-slate-950/80">
        <div className="mb-3 hidden items-center gap-4 md:flex">
            <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
            <div className="flex flex-wrap items-center gap-2 text-lg">
                <NavLinks/>
            </div>
            <div className="ml-auto flex items-center gap-4">
                <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:flex">
                    <span className={socketConnected ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-red-500"}></span>
                    <span>{socketConnected ? t("ui_new.nav.live_connected") : t("ui_new.nav.offline")}</span>
                </div>
                <button
                    type="button"
                    className={cn("rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800", location.pathname.includes('settings') && "bg-cyan-100/80 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100")}
                    onClick={() => navigate('/settings')}
                >
                    {t("ui_new.nav.settings")}
                </button>
                <button
                    type="button"
                    className={cn("rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800", location.pathname.includes('help') && "bg-cyan-100/80 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-100")}
                    onClick={() => navigate('/help')}
                >
                    {t("ui_new.nav.help")}
                </button>
            </div>
        </div>

        <div className="flex items-center justify-between md:hidden">
            <button type="button" className="rounded-lg border border-gray-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" onClick={() => setOpen(true)}><Menu/></button>
            <img src={logo} className="w-9" alt="LIVISI Smarthome logo"/>
            <div className="flex items-center gap-2">
                <span className={socketConnected ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-red-500"}></span>
                <span className="text-xs text-slate-600 dark:text-slate-300">{socketConnected ? t("ui_new.nav.live") : t("ui_new.nav.offline")}</span>
            </div>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/45 md:hidden" onClick={() => setOpen(false)}/>
                <Dialog.Content className={cn("fixed inset-y-0 left-0 z-[90] h-dvh w-[85%] max-w-[340px] overflow-y-auto border-r border-gray-200 bg-white p-4 shadow-2xl md:hidden dark:border-slate-700 dark:bg-slate-950", open ? "drawer-custom" : "drawer-custom-close")}>
                    <Dialog.Title className="mb-4 flex items-center justify-between">
                        <img src={logo} className="w-10" alt="LIVISI Smarthome logo"/>
                        <button type="button" className="rounded-md border border-gray-200 p-1 dark:border-slate-700 dark:text-slate-200" onClick={() => setOpen(false)}>
                            <X/>
                        </button>
                    </Dialog.Title>
                    <Dialog.Description/>
                    <div className="flex flex-col gap-2 text-lg" onClick={() => setOpen(false)}>
                        <NavLinks/>
                        <button
                            type="button"
                            className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-left text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                            onClick={() => navigate('/settings')}
                        >
                            {t("ui_new.nav.settings")}
                        </button>
                        <button
                            type="button"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                            onClick={() => navigate('/help')}
                        >
                            {t("ui_new.nav.help")}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </div>
}
