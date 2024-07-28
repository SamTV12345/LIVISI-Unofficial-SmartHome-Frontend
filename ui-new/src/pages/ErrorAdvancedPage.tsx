import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {useContentModel} from "@/src/store.tsx";
import {useMemo, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

const LOGGING_TIME = [
    {
        display: "2 Stunden",
        value: 120
    },
    {
        display: "4 Stunden",
        value: 240
    },
    {
        display: "8 Stunden",
        value: 480
    },
    {
        display: "24 Stunden",
        value: 1440
    },
    {
        display: "7 Tage",
        value: 5040
    }
]


export const ErrorAdvancedPage = ()=>{
    const allThings = useContentModel(state => state.allThings)
    const [loggingTime, setLoggingTime] = useState<number>(0)
    const navigate = useNavigate()

    const shc = useMemo(()=> {
        return allThings?.devices['00000000000000000000000000000000']
    },    [allThings])

    return <PageComponent title="Erweiterte Fehlersuche">
        <PageBox description="Wählen Sie die Dauer, in der die Daten aufgezeichnet werden sollen." variant="gray">
        </PageBox>
        {
            LOGGING_TIME.map((time)=>{
                return <PageBox key={time.display} title={time.display} selected={loggingTime === time.value} onClick={()=>{
                    setLoggingTime(time.value)
                }}><div></div></PageBox>
            })
        }
        <PrimaryButton filled onClick={()=>{
            loggingTime &&
            axios.post("/action", {
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
        }}>OK</PrimaryButton>
    </PageComponent>
}
