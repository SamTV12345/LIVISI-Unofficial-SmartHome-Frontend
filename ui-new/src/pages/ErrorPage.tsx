import {useContentModel} from "@/src/store.tsx";
import {useEffect, useMemo, useState} from "react";
import axios, {AxiosResponse} from "axios";
import {useNavigate} from "react-router-dom";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";

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
    const navigate = useNavigate()
    const allThings = useContentModel(state => state.allThings)
    const shc = useMemo(()=> {
       return allThings?.devices['00000000000000000000000000000000']
    },    [allThings])
    const [loggingConf, setLoggingConf] = useState<LoggingResp|undefined>()
    const [countDown, setCountDown] = useState<number>(0)

    const retrieveLogging = ()=>{
        axios.post("/action",{
            id: shc!.id,
            type: "GetLoggingConfig",
            target: "/device/" + shc!.id,
            namespace: "core.RWE",
        } satisfies LoggingReq).then((resp: AxiosResponse<LoggingResp>)=>{
            setLoggingConf(resp.data)
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


    return <PageComponent title="Fehlerbehebung" to="/help">
        <PageBox title="Zentrale neu starten" description="Bei Problemen mit Ihrem SmartHome haben Sie hier die Möglichkeit, Ihre Zentrale neu zu starten.">
            <PrimaryButton onClick={async () => {
                await axios.post("/action", {
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
            }}>Neustart</PrimaryButton>
        </PageBox>

        <PageBox title="Erweiterte Fehlersuche" description="Bei unregelmäßig auftretenden Fehlern zwischen den Geräten und Systemaktivitäten.">
            {
                loggingConf && loggingConf.properties.expiresAfterMinutes !=0 && <div className="pt-2 pb-2">
                    Eingeschaltet - Gültigkeitsdauer der Fehlerbehebung: {formatTime(countDown)} Stunden

                </div>
            }

                <PrimaryButton onClick={()=>{
                    loggingConf&& (loggingConf.properties.expiresAfterMinutes === 0&&navigate('/help/errors/advanced'))

                    if (loggingConf && loggingConf.properties.expiresAfterMinutes !== 0) {
                        axios.post("/action", {
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

                            }
                        }).then(()=>{
                            setLoggingConf({...loggingConf, properties: {...loggingConf.properties, expiresAfterMinutes: 0,}})
                    })

                }}}>{loggingConf&& (loggingConf.properties.expiresAfterMinutes === 0? "Fehlersuche aktivieren": "Fehlersuche beenden")}</PrimaryButton>
            </PageBox>
            <PageBox title="Internetverbindung" description={<><p>Um Verbindungsprobleme als Ursache für Störungen (z.B.
                Abbrüche, fehlgeschlagene Updates) ihres SmartHomes
                auszuschließen, führen Sie bitte einen Test der Internetverbindung durch und fügen Sie die Ergebnisse
                (Ping,
                Upload-/Downloadrate) dem jeweiligen Ticket bei.</p><p>Für den Test wird die Seite speedtest.net in
                einem externen Fenster geöffnet.</p></>}>
                <PrimaryButton className="w-full h-14 mt-10" onClick={()=>{
                    window.open("https://www.speedtest.net/")
                }}>
                    Internetverbindung testen
                </PrimaryButton>
            </PageBox>

    </PageComponent>
}

////{"id":"c929864898e2453cbd375ef3ae4e7881","type":"Restart","target":"/device/00000000000000000000000000000000","namespace":"core.RWE","params":{"reason":{"type":"Constant","value":"User requested to restart smarthome controller."}}}
