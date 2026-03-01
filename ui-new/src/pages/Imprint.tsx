import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";

import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import { Link } from "../components/actionComponents/Link";
import {useTranslation} from "react-i18next";

export const Imprint = ()=>{
    const {t} = useTranslation();
    return <PageComponent title={t("ui_new.imprint.title")} to="/settings">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox title={t("ui_new.imprint.github_title")} description={t("ui_new.imprint.github_description")}>
                <Link href="https://github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend">github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend</Link>
            </PageBox>
            <PageBox title={t("ui_new.imprint.email_title")}  variant="gray">
                <Link href="mailto:samelus1998@outlook.de">samelus1998@outlook.de</Link>
            </PageBox>
            <PageBox title={t("ui_new.imprint.source_code_title")} description={t("ui_new.imprint.source_code_description")}>
            </PageBox>
        </div>
    </PageComponent>
}
