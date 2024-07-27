import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import { Input } from "../components/actionComponents/Input";
import { Link } from "../components/actionComponents/Link";
import { Checkbox } from "../components/actionComponents/CheckBox";
import {EmailConfig, useContentModel} from "@/src/store.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import axios from "axios";
import {useEffect, useState} from "react";
import {AlertDialog} from "@/src/components/layout/AlertDialog.tsx";

export const EmailPage = ()=>{
    const allthings = useContentModel(state=>state.allThings)
    const [emailAlertDialog, setEmailAlertDialog] = useState<boolean>(false)
    const [alertMessage, setAlertMessage] = useState<string>("test")
    const [emailConfig, setEmailConfig] = useState<EmailConfig>()
    const [status, setStatus] = useState<"error"|"success">("success")

    useEffect(() => {
        if (!allthings) return
        setEmailConfig(allthings.email)

    }, [allthings]);


    return <PageComponent title="E-Mail" to="/settings">
        <AlertDialog open={emailAlertDialog} setOpen={setEmailAlertDialog} msg={alertMessage} status={status}/>
        <PageBox description={<><p>Dieses Binding ermöglicht eine direkte Verbindung der Zentrale zum SMTP Server des
            bevorzugten E-Mail Providers. Die Daten zur SMTP-Serveradresse, dem Port usw. müssen beim jeweiligen
            Provider erfragt werden.
        </p><p>
            Hilfe zu diesem Binding findest Du am schnellsten in unserer Community (<Link
            href="https://lsh.community/">https://lsh.community/</Link>).
        </p></>}>

        </PageBox>
        <PageBox variant="gray" title="Adresse" description="Geben Sie die SMTP-Serveradresse Deines Providers ein.
            In den meisten Fällen ist dies eine Adresse der Form „smtp.deintolleranbieter.de“."></PageBox>
        <PageBox>
            <div className="ml-2 mr-2">
                <Input value={emailConfig&&emailConfig.server_address} onChange={(v)=>{
                    setEmailConfig({
                        ...emailConfig!,
                        server_address: v.target.value
                    })
                }}/>
            </div>
        </PageBox>
        <PageBox title="Port" description="Geben Sie den Port des SMTP-Servers ein. Normalerweise ist dies 465 oder 587." variant="gray">
        </PageBox>
        <PageBox>
            <Input value={emailConfig&&emailConfig.server_port_number} onChange={(v)=>{
                setEmailConfig({
                    ...emailConfig!,
                    server_port_number: parseInt(v.target.value)
                })
            }}/>
        </PageBox>
        <PageBox title="Benutzername" description="Benutzername für die Authentifizierung gegenüber dem SMTP-Server. Dies ist in der Regel Deine E-Mail-Adresse." variant="gray">
        </PageBox>
        <PageBox>
            <Input value={emailConfig&&emailConfig.email_username} onChange={(v)=>{
                setEmailConfig({
                    ...emailConfig!,
                    email_username: v.target.value
                })
            }} />
        </PageBox>
        <PageBox title="Passwort" description="Gib das Passwort für die Authentifizierung gegenüber dem SMTP-Server ein." variant="gray"/>
        <PageBox>
            <Input value={emailConfig&&emailConfig.email_password} type="password" onChange={(v)=>{
                setEmailConfig({
                    ...emailConfig!,
                    email_password: v.target.value
                })
            }}/>
        </PageBox>
        <PageBox title="E-Mail Adresse" description="Gib die Standardempfänger für E-Mails durch Komma getrennt ein">
        </PageBox>
        <PageBox>
            <Input value={emailConfig&&emailConfig.recipient_list.join(',')} onChange={(v)=>{
                setEmailConfig({
                    ...emailConfig!,
                    recipient_list: v.target.value.split(',').map((v)=>v.trim())
                })
            }}/>
        </PageBox>
        <PageBox title="Gerät unerreichbar" variant="gray">
        </PageBox>
        <PageBox>
            <div className="flex">
                <Checkbox className="" checked={emailConfig&&emailConfig.notifications_device_unreachable} onCheckedChange={()=>{
                    setEmailConfig({
                        ...emailConfig!,
                        notifications_device_unreachable: !emailConfig?.notifications_device_unreachable
                    })
                }}/> <span className="ml-2 text-sm self-center">Nachricht schicken, wenn ein Akku fast leer ist</span>
            </div>
        </PageBox>
        <PageBox title="Batterie schwach" variant="gray"/>
        <PageBox>
            <div className="flex">
                <Checkbox className="" checked={emailConfig&&emailConfig.notification_device_low_battery} onCheckedChange={()=>{
                    setEmailConfig({
                        ...emailConfig!,
                        notification_device_low_battery: !emailConfig!.notification_device_low_battery
                    })
                }}/> <span className="ml-2 text-sm self-center">Nachricht schicken, wenn die Batterie schwach ist</span>
            </div>
        </PageBox>

        <div className="flex gap-5 flex-col m-5">
            <PrimaryButton filled onClick={async () => {
                const result = await axios.get<{
                    result: string
                }>("/email/test")

                if (result.data.result === "AVAILABLE") {
                    setStatus("success")
                } else {
                    setStatus("error")
                }

                setAlertMessage("Verbindung klappt. Bitte prüfe, ob auch die E-Mail an den Standardempfänger ankam")
                setEmailAlertDialog(true)
            }}>
                Verbindung testen
            </PrimaryButton>
            <PrimaryButton filled onClick={()=>{
                axios.put("/email/settings", emailConfig)
                    .then(()=>useContentModel.getState().setAllThings({
                        ...allthings!,
                        email: emailConfig!
                    }))
            }}>Speichern</PrimaryButton>
        </div>
    </PageComponent>
}
