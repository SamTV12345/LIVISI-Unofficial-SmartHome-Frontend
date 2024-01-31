import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {useContentModel} from "@/src/store.tsx";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import App from "@/src/App.tsx";

export const Root = () => {
    const navigate = useNavigate()
    const loginData = useContentModel(state=>state.loginData)
    const setLoginData = useContentModel(state=>state.setLoginData)
    const loginConfig = useContentModel(state=>state.loginConfig)
    const extractLoginData = (auth_local: string)=>{
        const test = atob(auth_local)
        const res = test.split(":")

        auth_local && setLoginData({password: res[1], username: res[0],rememberMe: false})
        axios.defaults.headers.common['Authorization'] = 'Basic ' + auth_local;
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
                    axios.defaults.headers.common['Authorization'] = 'Basic ' + btoa(loginData.username + ":" + loginData.password);
                }
            }
            else if (loginConfig.oidcConfig && !axios.defaults.headers.common["Authorization"]){
                navigate("/logincom")
            }
        }
    },[loginConfig])

    if(!loginConfig || (loginConfig.basicAuth && !axios.defaults.headers.common["Authorization"]||(loginConfig.oidcConfigured&& !axios.defaults.headers.common["Authorization"]))){
        console.log("loading root")
        return <LoadingScreen/>
    }

    return <div className="h-full rounded-3xl"><App/></div>
}
