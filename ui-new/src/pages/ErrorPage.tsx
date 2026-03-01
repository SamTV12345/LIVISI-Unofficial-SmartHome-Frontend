import {useContentModel} from "@/src/store.tsx";
import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {postJson} from "@/src/api/httpClient.ts";
import {useTranslation} from "react-i18next";

type LoggingReq = {
    id: string,
    type: string,
    target: string,
    namespace: string,
}


type LoggingResp = {
    type: string,
    namespace: string,
    desc: string,
    target: string,
    properties:{
        expiresAfterMinutes: number
        module: string
    },
    resultCode: string
}


const formatTime = (seconds: number): string=> {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}

export const ErrorPage = () => {
    const {t} = useTranslation();
    const navigate = useNavigate()
    const allThings = useContentModel(state => state.allThings)
    const shc = useMemo(()=> {
       return allThings?.devices['00000000000000000000000000000000']
    },    [allThings])
    const [loggingConf, setLoggingConf] = useState<LoggingResp|undefined>()
    const [countDown, setCountDown] = useState<number>(0)

    const retrieveLogging = ()=>{
        postJson<LoggingResp>("/action",{
            id: shc!.id,
            type: "GetLoggingConfig",
            target: "/device/" + shc!.id,
            namespace: "core.RWE",
        } satisfies LoggingReq).then((resp)=>{
            setLoggingConf(resp)
        })
    }

    useEffect(() => {
        if (!shc) return
        retrieveLogging()
    }, [shc]);

    useEffect(() => {
        if(loggingConf && loggingConf.properties.expiresAfterMinutes !== 0){
            setCountDown(loggingConf.properties.expiresAfterMinutes * 60)
            const interval = setInterval(() => {
                setCountDown(countDown => countDown - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [loggingConf]);


    return <PageComponent title={t("ui_new.errors.page_title")} to="/help">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox title={t("ui_new.errors.restart_title")} description={t("ui_new.errors.restart_description")}>
                <PrimaryButton onClick={async () => {
                    await postJson("/action", {
                            id: shc!.id,
                            type: "Restart",
                            target: "/device/" + shc!.id,
                            namespace: "core.RWE",
                            params: {
                                reason: {
                                    type: "Constant",
                                    value: "User requested to restart smarthome controller."
                                }
                            }
                        }
                    )
                }}>{t("ui_new.errors.restart_button")}</PrimaryButton>
            </PageBox>

            <PageBox title={t("ui_new.errors.advanced_title")} description={t("ui_new.errors.advanced_description")}>
                {
                    loggingConf && loggingConf.properties.expiresAfterMinutes !=0 && <div className="pt-2 pb-2">
                        {t("ui_new.errors.active_duration")}: {formatTime(countDown)} {t("ui_new.common.hours")}

                    </div>
                }

                    <PrimaryButton onClick={()=>{
                        loggingConf&& (loggingConf.properties.expiresAfterMinutes === 0&&navigate('/help/errors/advanced'))

                        if (loggingConf && loggingConf.properties.expiresAfterMinutes !== 0) {
                            postJson("/action", {
                                id: shc!.id,
                                type: "SetLoggingConfig",
                                target: "/device/" + shc!.id,
                                namespace: "core.RWE",
                                params: {
                                    expiresAfterMinutes: {
                                        type: 'Constant',
                                        value: 1
                                    },
                                    reason: {
                                        type: 'Constant',
                                        value: 'Test'
                                    }

                                },
                            }).then(()=>{
                                setLoggingConf({...loggingConf, properties: {...loggingConf.properties, expiresAfterMinutes: 0,}})
                        })

                    }}}>{loggingConf&& (loggingConf.properties.expiresAfterMinutes === 0? t("ui_new.errors.enable_advanced"): t("ui_new.errors.disable_advanced"))}</PrimaryButton>
            </PageBox>
            <PageBox title={t("ui_new.errors.internet_title")} description={<><p>{t("ui_new.errors.internet_description_p1")}</p><p>{t("ui_new.errors.internet_description_p2")}</p></>}>
                <PrimaryButton className="w-full h-14 mt-10" onClick={()=>{
                    window.open("https://www.speedtest.net/")
                }}>
                    {t("ui_new.errors.internet_test_button")}
                </PrimaryButton>
            </PageBox>
        </div>

    </PageComponent>
}

////{"id":"c929864898e2453cbd375ef3ae4e7881","type":"Restart","target":"/device/00000000000000000000000000000000","namespace":"core.RWE","params":{"reason":{"type":"Constant","value":"User requested to restart smarthome controller."}}}
