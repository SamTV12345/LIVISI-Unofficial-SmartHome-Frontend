import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useContentModel} from "@/src/store.tsx";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import App from "@/src/App.tsx";
import {getAuthorizationHeader, setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

export const Root = () => {
    const navigate = useNavigate()
    const loginData = useContentModel(state=>state.loginData)
    const setLoginData = useContentModel(state=>state.setLoginData)
    const loginConfig = useContentModel(state=>state.loginConfig)
    const extractLoginData = (auth_local: string)=>{
        const test = atob(auth_local)
        const res = test.split(":")

        auth_local && setLoginData({password: res[1], username: res[0],rememberMe: false})
        setAuthorizationHeader('Basic ' + auth_local);
    }

    useEffect(()=>{
        if(loginConfig){
            if(loginConfig.basicAuth){
                const auth_local =  localStorage.getItem('auth')
                const auth_session = sessionStorage.getItem('auth')
                if(auth_local == undefined && auth_session == undefined && !loginData){
                    navigate("/logincom")
                }
                else if (auth_local && !loginData){
                    extractLoginData(auth_local)
                }
                else if (auth_session && !loginData){
                    extractLoginData(auth_session)
                }
                else if (loginData){
                    setAuthorizationHeader('Basic ' + btoa(loginData.username + ":" + loginData.password));
                }
            }
            else if (loginConfig.oidcConfig && !getAuthorizationHeader()){
                navigate("/logincom")
            }
        }
    },[loginConfig])

    const hasAuthorization = Boolean(getAuthorizationHeader());
    if(!loginConfig || (loginConfig.basicAuth && !hasAuthorization||(loginConfig.oidcConfigured&& !hasAuthorization))){
        console.log("loading root")
        return <LoadingScreen/>
    }

    return <div className="h-full rounded-3xl"><App/></div>
}
