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
            return "Keine Sonnenzeiten verfügbar.";
        }

        return <span className="space-y-1 block">
            <span className="block">Nächster Sonnenaufgang: {formatDateTime(sunTimes.nextSunrise ?? undefined)}</span>
            <span className="block">Nächster Sonnenuntergang: {formatDateTime(sunTimes.nextSunset ?? undefined)}</span>
        </span>;
    }, [sunTimes]);

    const cards: {
        id: string,
        title: string,
        description: ReactNode,
        icon: ReactNode,
        to?: string
    }[] = [
        {
            id: "mobile",
            title: "Mobiler Zugang",
            description: "Gültig (kostenfrei)",
            icon: <Smartphone size={18}/>,
            to: "/services/mobile-access"
        },
        {
            id: "sun",
            title: "Sonnenauf-/-untergang",
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

    return <PageComponent title="Dienste">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="Dienste"
                subtitle="Externe und zentrale SmartHome-Funktionen."
                badges={[
                    {label: "Remote Zugriff", icon: <Smartphone size={14}/>},
                    {label: "Automationen", icon: <CloudSun size={14}/>}
                ]}
                stats={[
                    {label: "Dienste", value: cards.length},
                    {label: "Aktiv", value: 1},
                    {label: "Inaktiv", value: cards.length - 1},
                    {label: "Nächstes Sonnen-Event", value: sunTimes?.nextEventAt ? formatDateTime(sunTimes.nextEventAt) : "-"}
                ]}
            />

            <ModernSection title="Verfügbare Dienste" description="Dienste öffnen oder Status prüfen." icon={<ShieldCheck size={18}/>}>
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
