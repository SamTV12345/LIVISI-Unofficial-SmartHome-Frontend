import {useEffect} from 'react'
import {useContentModel} from "@/src/store.tsx";
import {AuthProvider} from "react-oidc-context";
import {OIDCRefresher} from "@/src/components/navigation/OIDCRefresher.tsx";
import {ConfigModel} from "@/src/models/ConfigModel.ts";
import axios, {AxiosResponse} from "axios";
import {Outlet} from "react-router";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import {useNavigate} from "react-router-dom";

export const AuthWrapper = ()=>{
    const configModel = useContentModel(state=>state.loginConfig)
    const setLoginData = useContentModel(state=>state.setLoginConfig)
    const navigate = useNavigate()
    useEffect(()=>{
        axios.get("/config")
            .then((c:AxiosResponse<ConfigModel>)=>{
                setLoginData(c.data)
            })
    },[])

    if(configModel===undefined){
        return <LoadingScreen/>
    }

    if(configModel.oidcConfigured && configModel.oidcConfig){
        return <AuthProvider client_id={configModel.oidcConfig.clientId} authority={configModel.oidcConfig.authority} scope={configModel.oidcConfig.scope}
                             redirect_uri={configModel.oidcConfig.redirectUri}>
            <OIDCRefresher>
                <Outlet/>
            </OIDCRefresher>
        </AuthProvider>
    } else if (configModel.basicAuth) {
            let item = localStorage.getItem("auth")
            if (item === null) {
                item = sessionStorage.getItem("auth")
                if (item === null) {
                    navigate("/logincom")
                }
                else{
                    axios.defaults.headers.common['Authorization'] = "Basic "+item
                }
            }
            else{
                axios.defaults.headers.common['Authorization'] = "Basic "+item
            }
    }

    return <Outlet/>
}
