import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useContentModel} from "@/src/store.tsx";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import App from "@/src/App.tsx";
import {clearAuthorizationHeader, getAuthorizationHeader, setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

export const Root = () => {
    const navigate = useNavigate()
    const loginData = useContentModel(state=>state.loginData)
    const setLoginData = useContentModel(state=>state.setLoginData)
    const loginConfig = useContentModel(state=>state.loginConfig)
    const extractLoginData = (auth_local: string)=>{
        try {
            const test = atob(auth_local)
            const splitIndex = test.indexOf(":")
            const username = splitIndex >= 0 ? test.substring(0, splitIndex) : test
            const password = splitIndex >= 0 ? test.substring(splitIndex + 1) : ""
            setLoginData({password, username,rememberMe: false})
            setAuthorizationHeader('Basic ' + auth_local);
        } catch (_error) {
            clearAuthorizationHeader();
        }
    }

    useEffect(()=>{
        if (!loginConfig) {
            return;
        }

        if (loginConfig.authMode === "none") {
            clearAuthorizationHeader();
            return;
        }

        if (loginConfig.authMode === "basic") {
            const auth_local = localStorage.getItem('auth')
            const auth_session = sessionStorage.getItem('auth')
            if (auth_local === null && auth_session === null && !loginData) {
                navigate("/logincom")
            }
            else if (auth_local && !loginData) {
                extractLoginData(auth_local)
            }
            else if (auth_session && !loginData) {
                extractLoginData(auth_session)
            }
            else if (loginData) {
                setAuthorizationHeader('Basic ' + btoa(loginData.username + ":" + loginData.password));
            }
            return;
        }

        if (loginConfig.authMode === "oidc" && !getAuthorizationHeader()) {
            navigate("/logincom")
        }
    },[loginConfig, loginData, navigate])

    if(!loginConfig){
        console.log("loading root")
        return <LoadingScreen/>
    }

    if (loginConfig.authMode === "none") {
        return <div className="h-full rounded-3xl"><App/></div>
    }

    const hasAuthorization = Boolean(getAuthorizationHeader());
    if(!hasAuthorization){
        console.log("loading root")
        return <LoadingScreen/>
    }

    return <div className="h-full rounded-3xl"><App/></div>
}
