import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import axios, {AxiosResponse} from "axios";
import {USBStorage} from "@/src/models/USBStorage.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {HardDrive, LogOut, Mail, MapPin, Network, Router, Settings2, Shield, Wifi} from "lucide-react";

export const SettingsPage = () => {
    const navigate = useNavigate()
    const [usbStorage, setUSBStorage] = useState<USBStorage>()

    const settingsCards = useMemo(() => [
        {title: "Gerätetreiber", to: "/settings/deviceDrivers", icon: <Settings2 size={18}/>},
        {title: "Gerätestandorte", to: "/settings/deviceLocations", icon: <MapPin size={18}/>},
        {title: "Netzwerk verwalten", to: "/settings/network", icon: <Network size={18}/>},
        {title: "LAN", to: "/settings/lan", icon: <Router size={18}/>},
        {title: "WLAN", to: "/settings/wlan", icon: <Wifi size={18}/>},
        {title: "E-Mail", to: "/settings/email", icon: <Mail size={18}/>},
        {title: "Impressum", to: "/settings/imprint", icon: <Shield size={18}/>}
    ], []);

    const logout = () => {
        localStorage.removeItem("auth")
        sessionStorage.removeItem("auth")
        navigate("/logincom")
    }

    useEffect(() => {
        axios.get("/usb_storage")
            .then((value: AxiosResponse<USBStorage>) => {
                setUSBStorage(value.data)
            })
    }, []);

    const unmountUSBStorage = () => {
        axios.get("/unmount")
            .then(() => setUSBStorage({external_storage: false}))
    }

    return <PageComponent title="Einstellungen">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="Einstellungen"
                subtitle="System, Netzwerk und Geräteverwaltung an einer Stelle."
                badges={[
                    {label: `${settingsCards.length} Bereiche`, icon: <Settings2 size={14}/>},
                    {label: usbStorage?.external_storage ? "USB verbunden" : "Kein USB", icon: <HardDrive size={14}/>}
                ]}
                stats={[
                    {label: "Bereiche", value: settingsCards.length},
                    {label: "USB", value: usbStorage?.external_storage ? "Verbunden" : "Nicht verbunden"},
                    {label: "Netzwerk", value: "Konfigurierbar"},
                    {label: "Session", value: "Aktiv"}
                ]}
            />

            <ModernSection title="Bereiche" description="Konfigurationsseiten öffnen.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {settingsCards.map((card) => (
                        <button
                            key={card.title}
                            type="button"
                            onClick={() => navigate(card.to)}
                            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-cyan-200 hover:bg-cyan-50/30"
                        >
                            <div className="inline-flex items-center gap-2 text-sm text-cyan-700">{card.icon}{card.title}</div>
                            <div className="mt-2 text-xs text-slate-500">Öffnen</div>
                        </button>
                    ))}
                </div>
            </ModernSection>

            <ModernSection title="Systemaktionen" description="Direkte Aktionen für Session und Speichermedien.">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <PrimaryButton
                        disabled={!usbStorage?.external_storage}
                        filled
                        onClick={() => usbStorage?.external_storage && unmountUSBStorage()}
                    >
                        <span className="inline-flex items-center gap-2"><HardDrive size={14}/> USB-Stick auswerfen</span>
                    </PrimaryButton>
                    <PrimaryButton filled status="error" onClick={logout}>
                        <span className="inline-flex items-center gap-2"><LogOut size={14}/> Abmelden</span>
                    </PrimaryButton>
                </div>
            </ModernSection>
        </div>
    </PageComponent>
}
