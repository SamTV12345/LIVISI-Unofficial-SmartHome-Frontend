import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export const Page404 = () => {
    const navigate = useNavigate()
    const {t} = useTranslation()
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center bg-white pl-5 pr-5 pt-2 pb-2 rounded-xl">
                <h1 className="text-8xl font-bold">404</h1>
                <p className="text-gray-500">{t("ui_new.page_404.not_found")}</p>
                <a onClick={()=>navigate('/')} className="text-blue-500">{t("ui_new.page_404.back_home")}</a>
            </div>
        </div>
    )
}
