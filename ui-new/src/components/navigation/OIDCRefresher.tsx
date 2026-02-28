import {FC, PropsWithChildren} from "react";
import {useAuth} from "react-oidc-context";
import useOnMount from "@/src/hooks/useOnMount.tsx";
import {getAuthorizationHeader, setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

export const OIDCRefresher:FC<PropsWithChildren> = ({children})=>{
    const auth = useAuth()
    const refreshInterval = 1000*60

    useOnMount(()=>{
        const interval = setInterval(()=> {
            if (auth.user &&auth.user.expires_in&& auth.user.expires_in<70){
                auth.signinSilent()
                    .then(()=>{
                    })
            }
        }, refreshInterval)

        return ()=>clearInterval(interval)
    })

    if (getAuthorizationHeader() == undefined && auth.user?.access_token){
        setAuthorizationHeader('Bearer ' + auth.user.access_token)
    }

    return <>
            {children}
        </>
}
