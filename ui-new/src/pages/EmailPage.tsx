import {Suspense, useEffect, useState} from "react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {Input} from "../components/actionComponents/Input";
import {Link} from "../components/actionComponents/Link";
import {Checkbox} from "../components/actionComponents/CheckBox";
import {EmailConfig, useContentModel} from "@/src/store.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {AlertDialog} from "@/src/components/layout/AlertDialog.tsx";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";

const defaultEmailConfig: EmailConfig = {
    server_address: "",
    server_port_number: 0,
    email_username: "",
    email_password: "",
    recipient_list: [],
    notifications_device_unreachable: false,
    notification_device_low_battery: false
};

const EmailPageContent = () => {
    const setAllThings = useContentModel((state) => state.setAllThings);
    const {data: emailSettingsResponse} = apiQueryClient.useSuspenseQuery("get", "/email/settings");
    const [emailAlertDialog, setEmailAlertDialog] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string>("");
    const [emailConfig, setEmailConfig] = useState<EmailConfig>(defaultEmailConfig);
    const [status, setStatus] = useState<"error" | "success">("success");

    useEffect(() => {
        if (emailSettingsResponse) {
            setEmailConfig(emailSettingsResponse as EmailConfig);
        }
    }, [emailSettingsResponse]);

    return <PageComponent title="E-Mail" to="/settings">
        <AlertDialog open={emailAlertDialog} setOpen={setEmailAlertDialog} msg={alertMessage} status={status}/>
        <div className="space-y-4 p-4 md:p-6">
            <PageBox description={<><p>Dieses Binding ermöglicht eine direkte Verbindung der Zentrale zum SMTP Server des
                bevorzugten E-Mail Providers. Die Daten zur SMTP-Serveradresse, dem Port usw. müssen beim jeweiligen
                Provider erfragt werden.
            </p><p>
                Hilfe zu diesem Binding findest Du am schnellsten in unserer Community (<Link
                href="https://lsh.community/">https://lsh.community/</Link>).
            </p></>}>

            </PageBox>
            <PageBox variant="gray" title="Adresse" description="Geben Sie die SMTP-Serveradresse Deines Providers ein.
                In den meisten Fällen ist dies eine Adresse der Form „smtp.deintolleranbieter.de“."/>
            <PageBox>
                <div className="ml-2 mr-2">
                    <Input value={emailConfig.server_address} onChange={(event) => {
                        setEmailConfig({
                            ...emailConfig,
                            server_address: event.target.value
                        });
                    }}/>
                </div>
            </PageBox>
            <PageBox title="Port" description="Geben Sie den Port des SMTP-Servers ein. Normalerweise ist dies 465 oder 587." variant="gray"/>
            <PageBox>
                <Input value={emailConfig.server_port_number} onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        server_port_number: Number.parseInt(event.target.value, 10) || 0
                    });
                }}/>
            </PageBox>
            <PageBox title="Benutzername" description="Benutzername für die Authentifizierung gegenüber dem SMTP-Server. Dies ist in der Regel Deine E-Mail-Adresse." variant="gray"/>
            <PageBox>
                <Input value={emailConfig.email_username} onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        email_username: event.target.value
                    });
                }}/>
            </PageBox>
            <PageBox title="Passwort" description="Gib das Passwort für die Authentifizierung gegenüber dem SMTP-Server ein." variant="gray"/>
            <PageBox>
                <Input value={emailConfig.email_password} type="password" onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        email_password: event.target.value
                    });
                }}/>
            </PageBox>
            <PageBox title="E-Mail Adresse" description="Gib die Standardempfänger für E-Mails durch Komma getrennt ein"/>
            <PageBox>
                <Input value={emailConfig.recipient_list.join(",")} onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        recipient_list: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean)
                    });
                }}/>
            </PageBox>
            <PageBox title="Gerät unerreichbar" variant="gray"/>
            <PageBox>
                <div className="flex">
                    <Checkbox className="" checked={emailConfig.notifications_device_unreachable} onCheckedChange={() => {
                        setEmailConfig({
                            ...emailConfig,
                            notifications_device_unreachable: !emailConfig.notifications_device_unreachable
                        });
                    }}/>
                    <span className="ml-2 text-sm self-center">Nachricht schicken, wenn ein Akku fast leer ist</span>
                </div>
            </PageBox>
            <PageBox title="Batterie schwach" variant="gray"/>
            <PageBox>
                <div className="flex">
                    <Checkbox className="" checked={emailConfig.notification_device_low_battery} onCheckedChange={() => {
                        setEmailConfig({
                            ...emailConfig,
                            notification_device_low_battery: !emailConfig.notification_device_low_battery
                        });
                    }}/>
                    <span className="ml-2 text-sm self-center">Nachricht schicken, wenn die Batterie schwach ist</span>
                </div>
            </PageBox>

            <div className="flex flex-col gap-5 pt-2">
                <PrimaryButton filled onClick={async () => {
                    try {
                        const result = await openapiFetchClient.GET("/email/test");
                        if (!result.response.ok || !result.data) {
                            throw new Error("Email test failed");
                        }

                        if (result.data.result === "AVAILABLE") {
                            setStatus("success");
                            setAlertMessage("Verbindung klappt. Bitte prüfe, ob auch die E-Mail an den Standardempfänger ankam");
                        } else {
                            setStatus("error");
                            setAlertMessage("Verbindung fehlgeschlagen. Bitte prüfe Serveradresse, Port und Zugangsdaten.");
                        }
                    } catch {
                        setStatus("error");
                        setAlertMessage("Verbindungstest konnte nicht durchgeführt werden. Bitte prüfe die Verbindung zur Zentrale.");
                    } finally {
                        setEmailAlertDialog(true);
                    }
                }}>
                    Verbindung testen
                </PrimaryButton>
                <PrimaryButton filled onClick={async () => {
                    const response = await openapiFetchClient.PUT("/email/settings", {
                        body: emailConfig
                    });

                    if (!response.response.ok) {
                        setStatus("error");
                        setAlertMessage("E-Mail-Einstellungen konnten nicht gespeichert werden.");
                        setEmailAlertDialog(true);
                        return;
                    }

                    queryClient.setQueryData(apiQueryClient.queryOptions("get", "/email/settings").queryKey, emailConfig);
                    const currentState = useContentModel.getState().allThings;
                    if (currentState) {
                        setAllThings({
                            ...currentState,
                            email: emailConfig
                        });
                    }

                    setStatus("success");
                    setAlertMessage("E-Mail-Einstellungen wurden gespeichert.");
                    setEmailAlertDialog(true);
                }}>Speichern</PrimaryButton>
            </div>
        </div>
    </PageComponent>;
};

export const EmailPage = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={8}/>}>
            <EmailPageContent/>
        </Suspense>
    );
};
