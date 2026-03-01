import {Suspense, useMemo} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useTranslation} from "react-i18next";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {CloudSun, Globe, ShieldCheck, Smartphone} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {ReactNode} from "react";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";

const formatDateTime = (isoDate?: string): string => {
    if (!isoDate) {
        return "-";
    }
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return date.toLocaleString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const ServicesScreenContent = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {data: sunTimes} = apiQueryClient.useSuspenseQuery("get", "/service/sun-times");

    const sunDescription = useMemo<ReactNode>(() => {
        if (!sunTimes) {
            return t("ui_new.services.no_sun_times");
        }

        return <span className="space-y-1 block">
            <span className="block">{t("ui_new.services.next_sunrise", {value: formatDateTime(sunTimes.nextSunrise ?? undefined)})}</span>
            <span className="block">{t("ui_new.services.next_sunset", {value: formatDateTime(sunTimes.nextSunset ?? undefined)})}</span>
        </span>;
    }, [sunTimes, t]);

    const cards: {
        id: string,
        title: string,
        description: ReactNode,
        icon: ReactNode,
        to?: string
    }[] = [
        {
            id: "mobile",
            title: t("ui_new.mobile_access.title"),
            description: t("ui_new.services.mobile_valid_free"),
            icon: <Smartphone size={18}/>,
            to: "/services/mobile-access"
        },
        {
            id: "sun",
            title: t("ui_new.services.sun_times_title"),
            description: sunDescription,
            icon: <CloudSun size={18}/>
        },
        {
            id: "sms",
            title: "SMS",
            description: `0 ${t('SmartCode.ServiceDetails.SMSRemaining')}`,
            icon: <Globe size={18}/>
        }
    ];

    return <PageComponent title={t("ui_new.services.page_title")}>
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={t("ui_new.services.hero_title")}
                subtitle={t("ui_new.services.hero_subtitle")}
                badges={[
                    {label: t("ui_new.services.remote_access"), icon: <Smartphone size={14}/>},
                    {label: t("ui_new.services.automations"), icon: <CloudSun size={14}/>}
                ]}
                stats={[
                    {label: t("ui_new.services.stats_services"), value: cards.length},
                    {label: t("ui_new.common.active"), value: 1},
                    {label: t("ui_new.common.inactive"), value: cards.length - 1},
                    {label: t("ui_new.services.stats_next_sun_event"), value: sunTimes?.nextEventAt ? formatDateTime(sunTimes.nextEventAt) : "-"}
                ]}
            />

            <ModernSection title={t("ui_new.services.available_services_title")} description={t("ui_new.services.available_services_description")} icon={<ShieldCheck size={18}/>}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {cards.map((card) => (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => card.to && navigate(card.to)}
                            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-cyan-200 hover:bg-cyan-50/30 disabled:cursor-default"
                            disabled={!card.to}
                        >
                            <div className="inline-flex items-center gap-2 text-sm text-cyan-700">{card.icon}{card.title}</div>
                            <div className="mt-2 text-sm text-slate-600">{card.description}</div>
                        </button>
                    ))}
                </div>
            </ModernSection>
        </div>
    </PageComponent>
};

export const ServicesScreen = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={3}/>}>
            <ServicesScreenContent/>
        </Suspense>
    );
};
