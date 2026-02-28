import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {CheckCircle2, Globe, ShieldCheck, Smartphone} from "lucide-react";

export const MobileAccessScreen = () => {
    return <PageComponent title="Mobiler Zugang" to="/services">
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title="Mobiler Zugang"
                subtitle="Fernzugriff auf dein SmartHome über mobile Endgeräte."
                badges={[
                    {label: "Aktiv", icon: <CheckCircle2 size={14}/>},
                    {label: "Kostenfrei", icon: <ShieldCheck size={14}/>}
                ]}
                stats={[
                    {label: "Status", value: "Gültig"},
                    {label: "Kosten", value: "0 €"},
                    {label: "Zugriff", value: "Remote"},
                    {label: "Plattform", value: "App + Web"}
                ]}
            />

            <ModernSection title="Dienstbeschreibung" description="Der mobile Zugriff ist für dein System aktiviert." icon={<Smartphone size={18}/>}>
                <div className="space-y-2 text-sm text-slate-700">
                    <p>Dieser Dienst wird automatisch für alle Kunden gebucht und kann kostenfrei genutzt werden.</p>
                    <p>Damit kannst du dein Zuhause auch unterwegs steuern und den aktuellen Systemzustand prüfen.</p>
                </div>
            </ModernSection>

            <ModernSection title="Leistungsumfang" description="Was der Dienst bereitstellt." icon={<Globe size={18}/>}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {[
                        "Sicherer Zugriff auf Geräte und Szenarien",
                        "Statusabfrage in Echtzeit",
                        "Steuerung über mobile App",
                        "Verfügbar ohne Zusatzkosten"
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
