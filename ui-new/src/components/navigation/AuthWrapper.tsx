import {FC, PropsWithChildren, useEffect} from 'react'
import {useContentModel} from "@/src/store.tsx";
import {AuthProvider} from "react-oidc-context";
import {OIDCRefresher} from "@/src/components/navigation/OIDCRefresher.tsx";
import {ConfigModel} from "@/src/models/ConfigModel.ts";
import axios, {AxiosResponse} from "axios";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import {LoginComponent} from "@/src/components/layout/Login.tsx";

export const AuthWrapper:FC<PropsWithChildren> = ({children})=>{
    const configModel = useContentModel(state=>state.loginConfig)
    const setLoginData = useContentModel(state=>state.setLoginConfig)

    useEffect(()=>{
        axios.get("/api/server")
            .then((c:AxiosResponse<ConfigModel>)=>{
                setLoginData(c.data)
            })
    },[])

    if(configModel===undefined){
        return <LoadingScreen/>
    }

    if(configModel.oidcConfigured && configModel.oidcConfig){
        return <AuthProvider client_id={configModel.oidcConfig.clientId as string} authority={configModel.oidcConfig.authority as string} scope={configModel.oidcConfig.scope as string}
                             redirect_uri={configModel.oidcConfig.redirectUri as string}>
            <OIDCRefresher>
                {children}
            </OIDCRefresher>
        </AuthProvider>
    } else if (configModel.basicAuth) {
            let item = localStorage.getItem("auth")
            if (item === null) {
                item = sessionStorage.getItem("auth")
                if (item === null) {
                    return <LoginComponent/>
                }
                else{
                    axios.defaults.headers.common['Authorization'] = "Basic "+item
                }
            }
            else{
                axios.defaults.headers.common['Authorization'] = "Basic "+item
            }
    }

    return children
}
