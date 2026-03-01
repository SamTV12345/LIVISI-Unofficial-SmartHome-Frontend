import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {postJson} from "@/src/api/httpClient.ts";
import {useTranslation} from "react-i18next";

const LOGGING_TIME = [
    {
        key: "ui_new.errors.logging_time_2h",
        value: 120
    },
    {
        key: "ui_new.errors.logging_time_4h",
        value: 240
    },
    {
        key: "ui_new.errors.logging_time_8h",
        value: 480
    },
    {
        key: "ui_new.errors.logging_time_24h",
        value: 1440
    },
    {
        key: "ui_new.errors.logging_time_7d",
        value: 5040
    }
]


export const ErrorAdvancedPage = ()=>{
    const {t} = useTranslation();
    const allThings = useContentModel(state => state.allThings)
    const [loggingTime, setLoggingTime] = useState<number>(0)
    const navigate = useNavigate()

    const shc = useMemo(()=> {
        return allThings?.devices['00000000000000000000000000000000']
    },    [allThings])

    return <PageComponent title={t("ui_new.errors.advanced_title")}>
        <div className="space-y-4 p-4 md:p-6">
            <PageBox description={t("ui_new.errors.advanced_duration_description")} variant="gray">
            </PageBox>
            {
                LOGGING_TIME.map((time)=>{
                    return <PageBox key={time.key} title={t(time.key)} selected={loggingTime === time.value} onClick={()=>{
                        setLoggingTime(time.value)
                    }}><div></div></PageBox>
                })
            }
            <PrimaryButton filled onClick={()=>{
                loggingTime &&
                postJson("/action", {
                    id: shc!.id,
                    type: "SetLoggingConfig",
                    target: "/device/" + shc!.id,
                    namespace: "core.RWE",
                    params: {
                        expiresAfterMinutes: {
                            type: 'Constant',
                            value: loggingTime
                        },
                        reason: {
                            type: 'Constant',
                            value: 'Test'
                        }

                    }
                })
                navigate("/help/errors")
            }}>{t("ui_new.common.ok")}</PrimaryButton>
        </div>
    </PageComponent>
}
