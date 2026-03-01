import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {useTranslation} from "react-i18next";

export const HelpPage = () => {
    const {t} = useTranslation();

    return <PageComponent title={t("ui_new.help.title")}>
        <div className="space-y-4 p-4 md:p-6">
            <PageBox title={t("ui_new.help.about_project_title")} to="/settings/imprint" description={t("ui_new.help.about_project_description")}>

            </PageBox>
            <PageBox title={t("ui_new.help.troubleshooting_title")} to="/help/errors" description={t("ui_new.help.troubleshooting_description")}>

            </PageBox>
        </div>
    </PageComponent>
}

