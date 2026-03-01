import {FC, PropsWithChildren, useEffect} from "react";
import {useAuth} from "react-oidc-context";
import useOnMount from "@/src/hooks/useOnMount.tsx";
import {clearAuthorizationHeader, setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

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

    useEffect(() => {
        if (auth.user?.access_token) {
            setAuthorizationHeader('Bearer ' + auth.user.access_token)
            return;
        }
        if (!auth.isLoading) {
            clearAuthorizationHeader();
        }
    }, [auth.user?.access_token, auth.isLoading])

    return <>
            {children}
        </>
}
