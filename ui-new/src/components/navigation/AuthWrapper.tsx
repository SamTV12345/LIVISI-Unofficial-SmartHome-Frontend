import {FC, PropsWithChildren, useEffect} from 'react'
import {useContentModel} from "@/src/store.tsx";
import {AuthProvider} from "react-oidc-context";
import {OIDCRefresher} from "@/src/components/navigation/OIDCRefresher.tsx";
import {ConfigModel} from "@/src/models/ConfigModel.ts";
import {useNavigate} from "react-router-dom";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

export const AuthWrapper:FC<PropsWithChildren> = ({children})=>{
    const configModel = useContentModel(state=>state.loginConfig)
    const setLoginData = useContentModel(state=>state.setLoginConfig)
    const navigate = useNavigate()
    const {data: serverConfig} = apiQueryClient.useSuspenseQuery("get", "/api/server");
    const normalizedConfig: ConfigModel | undefined = serverConfig ? {
        podindexConfigured: false,
        rssFeed: "",
        serverUrl: "",
        basicAuth: serverConfig.basicAuth ? "true" : "",
        oidcConfigured: serverConfig.oidcConfigured,
        oidcConfig: serverConfig.oidcConfig ? {
            authority: serverConfig.oidcConfig.authority,
            clientId: serverConfig.oidcConfig.clientId,
            redirectUri: serverConfig.oidcConfig.redirectUri,
            scope: serverConfig.oidcConfig.scope
        } : undefined
    } : undefined;

    useEffect(()=>{
        if (!configModel && normalizedConfig) {
            setLoginData(normalizedConfig)
        }
    },[configModel, normalizedConfig, setLoginData])

    const activeConfig = (configModel ?? normalizedConfig);
    if (!activeConfig) return children;

    if(activeConfig.oidcConfigured){
        return <AuthProvider client_id={activeConfig.oidcConfig!.clientId}
                             authority={activeConfig.oidcConfig!.authority} scope={activeConfig.oidcConfig!.scope}
                             redirect_uri={activeConfig.oidcConfig!.redirectUri}>
            <OIDCRefresher>
                {children}
            </OIDCRefresher>
        </AuthProvider>
    } else if (activeConfig.basicAuth) {
            let item = localStorage.getItem("auth")
            if (item === null) {
                item = sessionStorage.getItem("auth")
                if (item === null) {
                    navigate("/logincom")
                }
                else{
                    setAuthorizationHeader("Basic " + item)
                }
            }
            else{
                setAuthorizationHeader("Basic " + item)
            }
    }

    return children
}
