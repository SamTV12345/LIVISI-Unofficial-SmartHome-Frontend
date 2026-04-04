import {Suspense, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {HardDrive, LogOut, Mail, MapPin, Network, Router, Settings2, Shield, Wifi} from "lucide-react";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {clearAuthorizationHeader} from "@/src/api/authHeaderStore.ts";
import {useTranslation} from "react-i18next";
import {BellRing} from "lucide-react";

const SettingsPageContent = () => {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const {data: usbStorage} = apiQueryClient.useSuspenseQuery("get", "/usb_storage");

    const settingsCards = useMemo(() => [
        {title: t("ui_new.settings.card_device_drivers"), to: "/settings/deviceDrivers", icon: <Settings2 size={18}/>},
        {title: t("ui_new.settings.card_device_locations"), to: "/settings/deviceLocations", icon: <MapPin size={18}/>},
        {title: t("ui_new.settings.card_network"), to: "/settings/network", icon: <Network size={18}/>},
        {title: t("ui_new.lan.title"), to: "/settings/lan", icon: <Router size={18}/>},
        {title: t("ui_new.wlan.title"), to: "/settings/wlan", icon: <Wifi size={18}/>},
        {title: t("ui_new.settings.card_email"), to: "/settings/email", icon: <Mail size={18}/>},
        {title: t("ui_new.settings.card_sentry"), to: "/settings/sentry", icon: <BellRing size={18}/>},
        {title: t("ui_new.settings.card_imprint"), to: "/settings/imprint", icon: <Shield size={18}/>}
    ], [t]);

    const logout = () => {
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
        clearAuthorizationHeader();
        navigate("/logincom");
    };

    const unmountUSBStorage = () => {
        openapiFetchClient.GET("/unmount")
            .then((response) => {
                if (response.error) {
                    return;
                }
                queryClient.setQueryData(apiQueryClient.queryOptions("get", "/usb_storage").queryKey, {external_storage: false});
            });
    };

    return <PageComponent title={t("ui_new.settings.page_title")}>
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={t("ui_new.settings.hero_title")}
                subtitle={t("ui_new.settings.hero_subtitle")}
                badges={[
                    {label: t("ui_new.settings.areas_count", {count: settingsCards.length}), icon: <Settings2 size={14}/>},
                    {label: usbStorage?.external_storage ? t("ui_new.settings.usb_connected") : t("ui_new.settings.no_usb"), icon: <HardDrive size={14}/>}
                ]}
                stats={[
                    {label: t("ui_new.settings.stats_areas"), value: settingsCards.length},
                    {label: "USB", value: usbStorage?.external_storage ? t("ui_new.common.connected") : t("ui_new.common.not_connected")},
                    {label: t("ui_new.settings.stats_network"), value: t("ui_new.settings.configurable")},
                    {label: t("ui_new.settings.stats_session"), value: t("ui_new.common.active")}
                ]}
            />

            <ModernSection title={t("ui_new.settings.section_areas")} description={t("ui_new.settings.section_areas_description")}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {settingsCards.map((card) => (
                        <button
                            key={card.title}
                            type="button"
                            onClick={() => navigate(card.to)}
                            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-cyan-200 hover:bg-cyan-50/30"
                        >
                            <div className="inline-flex items-center gap-2 text-sm text-cyan-700">{card.icon}{card.title}</div>
                            <div className="mt-2 text-xs text-slate-500">{t("ui_new.settings.open")}</div>
                        </button>
                    ))}
                </div>
            </ModernSection>

            <ModernSection title={t("ui_new.settings.system_actions_title")} description={t("ui_new.settings.system_actions_description")}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <PrimaryButton
                        disabled={!usbStorage?.external_storage}
                        filled
                        onClick={() => usbStorage?.external_storage && unmountUSBStorage()}
                    >
                        <span className="inline-flex items-center gap-2"><HardDrive size={14}/> {t("ui_new.settings.eject_usb")}</span>
                    </PrimaryButton>
                    <PrimaryButton filled status="error" onClick={logout}>
                        <span className="inline-flex items-center gap-2"><LogOut size={14}/> {t("ui_new.settings.logout")}</span>
                    </PrimaryButton>
                </div>
            </ModernSection>
        </div>
    </PageComponent>;
};

export const SettingsPage = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={8}/>}>
            <SettingsPageContent/>
        </Suspense>
    );
};
