import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";

import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import { Link } from "../components/actionComponents/Link";

export const Imprint = ()=>{
    return <PageComponent title="Impressum">
        <PageBox title="GitHub" description="Generell für Fragen, Updates etc. wird GitHub verwendet">
            <Link href="https://github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend">github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend</Link>
        </PageBox>
        <PageBox title="E-Mail"  variant="gray">
            <Link href="mailto:samelus1998@outlook.de">samelus1998@outlook.de</Link>
        </PageBox>
        <PageBox title="Source-Code" description="Der Source-Code wurde in mühevoller Arbeit nachgebaut, weil Livisi nicht bereit war, den Source-Code zu veröffentlichen.">
        </PageBox>
    </PageComponent>
}
