import {ArrowLeft} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export const AboutPage = ()=>{
    const navigate = useNavigate()
    const {t} = useTranslation()

    return <div>
        <button onClick={() => navigate(-1)}><ArrowLeft/></button>
        <h1 className="text-2xl ">{t("ui_new.about.project_title")}</h1>
        <a className="before:absolute before:block before:w-full before:h-[2px]
              before:bottom-0 before:left-0 before:bg-black
              before:hover:scale-x-100 before:scale-x-0 before:origin-top-left
              before:transition before:ease-in-out before:duration-300" target="_blank"
           href="https://github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend">{t("ui_new.about.project_link")}</a>
        <h1>{t("ui_new.about.developer_title")}</h1>
        <p>SamTV12345</p>
    </div>
}
