import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {CheckCircle2, Globe, ShieldCheck, Smartphone} from "lucide-react";
import {useTranslation} from "react-i18next";

export const MobileAccessScreen = () => {
    const {t} = useTranslation();
    return <PageComponent title={t("ui_new.mobile_access.title")} to="/services">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={t("ui_new.mobile_access.title")}
                subtitle={t("ui_new.mobile_access.subtitle")}
                badges={[
                    {label: t("ui_new.common.active"), icon: <CheckCircle2 size={14}/>},
                    {label: t("ui_new.mobile_access.free"), icon: <ShieldCheck size={14}/>}
                ]}
                stats={[
                    {label: t("ui_new.common.status"), value: t("ui_new.mobile_access.valid")},
                    {label: t("ui_new.mobile_access.cost"), value: "0 €"},
                    {label: t("ui_new.mobile_access.access"), value: t("ui_new.mobile_access.remote")},
                    {label: t("ui_new.mobile_access.platform"), value: t("ui_new.mobile_access.platform_value")}
                ]}
            />

            <ModernSection title={t("ui_new.mobile_access.description_title")} description={t("ui_new.mobile_access.description_subtitle")} icon={<Smartphone size={18}/>}>
                <div className="space-y-2 text-sm text-slate-700">
                    <p>{t("ui_new.mobile_access.description_p1")}</p>
                    <p>{t("ui_new.mobile_access.description_p2")}</p>
                </div>
            </ModernSection>

            <ModernSection title={t("ui_new.mobile_access.features_title")} description={t("ui_new.mobile_access.features_subtitle")} icon={<Globe size={18}/>}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {[
                        t("ui_new.mobile_access.feature_secure_access"),
                        t("ui_new.mobile_access.feature_realtime_status"),
                        t("ui_new.mobile_access.feature_mobile_control"),
                        t("ui_new.mobile_access.feature_no_extra_cost")
                    ].map((entry) => (
                        <div key={entry} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-700">
                            <CheckCircle2 size={14} className="text-emerald-600"/>
                            {entry}
                        </div>
                    ))}
                </div>
            </ModernSection>
        </div>
    </PageComponent>
}
