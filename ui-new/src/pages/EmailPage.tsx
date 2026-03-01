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
import {useTranslation} from "react-i18next";

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
    const {t} = useTranslation();
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

    return <PageComponent title={t("ui_new.email.page_title")} to="/settings">
        <AlertDialog open={emailAlertDialog} setOpen={setEmailAlertDialog} msg={alertMessage} status={status}/>
        <div className="space-y-4 p-4 md:p-6">
            <PageBox description={<><p>{t("ui_new.email.intro_p1")}
            </p><p>
                {t("ui_new.email.intro_p2")} (<Link
                href="https://lsh.community/">https://lsh.community/</Link>).
            </p></>}>

            </PageBox>
            <PageBox variant="gray" title={t("ui_new.email.address_title")} description={t("ui_new.email.address_description")}/>
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
            <PageBox title={t("ui_new.email.port_title")} description={t("ui_new.email.port_description")} variant="gray"/>
            <PageBox>
                <Input value={emailConfig.server_port_number} onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        server_port_number: Number.parseInt(event.target.value, 10) || 0
                    });
                }}/>
            </PageBox>
            <PageBox title={t("ui_new.login.username_label")} description={t("ui_new.email.username_description")} variant="gray"/>
            <PageBox>
                <Input value={emailConfig.email_username} onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        email_username: event.target.value
                    });
                }}/>
            </PageBox>
            <PageBox title={t("ui_new.login.password_label")} description={t("ui_new.email.password_description")} variant="gray"/>
            <PageBox>
                <Input value={emailConfig.email_password} type="password" onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        email_password: event.target.value
                    });
                }}/>
            </PageBox>
            <PageBox title={t("ui_new.email.default_recipient_title")} description={t("ui_new.email.default_recipient_description")}/>
            <PageBox>
                <Input value={emailConfig.recipient_list.join(",")} onChange={(event) => {
                    setEmailConfig({
                        ...emailConfig,
                        recipient_list: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean)
                    });
                }}/>
            </PageBox>
            <PageBox title={t("ui_new.email.device_unreachable_title")} variant="gray"/>
            <PageBox>
                <div className="flex">
                    <Checkbox className="" checked={emailConfig.notifications_device_unreachable} onCheckedChange={() => {
                        setEmailConfig({
                            ...emailConfig,
                            notifications_device_unreachable: !emailConfig.notifications_device_unreachable
                        });
                    }}/>
                    <span className="ml-2 text-sm self-center">{t("ui_new.email.device_unreachable_text")}</span>
                </div>
            </PageBox>
            <PageBox title={t("ui_new.email.low_battery_title")} variant="gray"/>
            <PageBox>
                <div className="flex">
                    <Checkbox className="" checked={emailConfig.notification_device_low_battery} onCheckedChange={() => {
                        setEmailConfig({
                            ...emailConfig,
                            notification_device_low_battery: !emailConfig.notification_device_low_battery
                        });
                    }}/>
                    <span className="ml-2 text-sm self-center">{t("ui_new.email.low_battery_text")}</span>
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
                            setAlertMessage(t("ui_new.email.test_success"));
                        } else {
                            setStatus("error");
                            setAlertMessage(t("ui_new.email.test_failed"));
                        }
                    } catch {
                        setStatus("error");
                        setAlertMessage(t("ui_new.email.test_unavailable"));
                    } finally {
                        setEmailAlertDialog(true);
                    }
                }}>
                    {t("ui_new.email.test_connection")}
                </PrimaryButton>
                <PrimaryButton filled onClick={async () => {
                    const response = await openapiFetchClient.PUT("/email/settings", {
                        body: emailConfig
                    });

                    if (!response.response.ok) {
                        setStatus("error");
                        setAlertMessage(t("ui_new.email.save_failed"));
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
                    setAlertMessage(t("ui_new.email.save_success"));
                    setEmailAlertDialog(true);
                }}>{t("ui_new.common.save")}</PrimaryButton>
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
