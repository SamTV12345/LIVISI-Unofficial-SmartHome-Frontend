import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";

export const HelpPage = () => {

    return <PageComponent title="Hilfe">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox title="Über das Projekt" to="/settings/imprint" description="Kontaktdaten, Info-/Bestellhotline, Impressum">

            </PageBox>
            <PageBox title="Fehlerbehebung" to="/help/errors" description="Suchen und Beheben von Fehlern">

            </PageBox>
        </div>
    </PageComponent>
}

