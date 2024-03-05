import {FC, PropsWithChildren} from "react";
import {useAuth} from "react-oidc-context";
import axios from "axios";
import useOnMount from "@/src/hooks/useOnMount.tsx";

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

    if (axios.defaults.headers.common['Authorization'] == undefined && auth.user?.access_token){
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + auth.user.access_token
    }

    return <>
            {children}
        </>
}
