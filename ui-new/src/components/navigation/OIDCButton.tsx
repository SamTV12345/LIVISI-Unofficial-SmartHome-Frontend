import {useAuth} from "react-oidc-context";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";
import {useEffect} from "react";

export const OIDCLogin = () => {
    const auth = useAuth()
    const navigate = useNavigate()
    const {t} = useTranslation()

    useEffect(() => {
        if (auth.isAuthenticated && auth.user) {
            setAuthorizationHeader('Bearer ' + auth.user.access_token);
            navigate("/")
        }
    }, [auth.isAuthenticated, auth.user, navigate])



    return  <button  className="bg-blue-600 rounded pt-2 pb-2 w-full hover:bg-blue-500 active:scale-95" onClick={()=>{
        auth.signinRedirect()
            .then(()=>{
            })
    }}>{t('oidc-login')}</button>
}
