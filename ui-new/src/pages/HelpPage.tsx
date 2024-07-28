import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";

export const HelpPage = () => {

    return <PageComponent title="Hilfe">
            <PageBox title="Über das Projekt" to="/settings/imprint" description="Kontaktdaten, Info-/Bestellhotline, Impressum">

            </PageBox>
            <PageBox title="Fehlerbehebung" to="/help/errors" description="Suchen und Beheben von Fehlern">

            </PageBox>
        </PageComponent>
}

