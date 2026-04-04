import {Suspense, useEffect, useMemo, useState} from "react";
import {BellRing, Bot, DoorOpen, Globe, ShieldAlert, ShieldCheck} from "lucide-react";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {Checkbox} from "@/src/components/actionComponents/CheckBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {AlertDialog} from "@/src/components/layout/AlertDialog.tsx";
import {Input} from "@/src/components/layout/Input.tsx";
import {Label} from "@/src/components/layout/Label.tsx";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {queryClient} from "@/src/api/queryClient.ts";
import {Device} from "@/src/models/Device.ts";
import {SentrySettings, TelegramProviderConfig, useContentModel, WebhookProviderConfig} from "@/src/store.tsx";
import {useTranslation} from "react-i18next";

const defaultSentrySettings: SentrySettings = {
    enabled: false,
    monitored_device_ids: [],
    provider: {
        kind: "telegram",
        bot_token: "",
        chat_id: "",
        message_thread_id: null
    }
};

const asTelegramProvider = (settings: SentrySettings): TelegramProviderConfig => {
    if (settings.provider.kind === "telegram") {
        return settings.provider;
    }

    return {
        kind: "telegram",
        bot_token: "",
        chat_id: "",
        message_thread_id: null
    };
};

const asWebhookProvider = (settings: SentrySettings): WebhookProviderConfig => {
    if (settings.provider.kind === "webhook") {
        return settings.provider;
    }

    return {
        kind: "webhook",
        url: "",
        bearer_token: ""
    };
};

const isWindowSensor = (device: Device) => device.type === "WDS";

const sortSensors = (left: Device, right: Device) => {
    const leftName = left.config?.name ?? left.id;
    const rightName = right.config?.name ?? right.id;
    return leftName.localeCompare(rightName);
};

const SentryPageContent = () => {
    const {t} = useTranslation();
    const setAllThings = useContentModel((state) => state.setAllThings);
    const allThings = useContentModel((state) => state.allThings);
    const {data: sentrySettingsResponse} = apiQueryClient.useSuspenseQuery("get", "/sentry/settings");
    const [sentrySettings, setSentrySettings] = useState<SentrySettings>(defaultSentrySettings);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [dialogStatus, setDialogStatus] = useState<"error" | "success">("success");

    const availableSensors = useMemo(
        () => Object.values(allThings?.devices ?? {}).filter(isWindowSensor).sort(sortSensors),
        [allThings?.devices]
    );

    useEffect(() => {
        if (sentrySettingsResponse) {
            setSentrySettings(sentrySettingsResponse as SentrySettings);
        }
    }, [sentrySettingsResponse]);

    const updateProvider = (provider: TelegramProviderConfig | WebhookProviderConfig) => {
        setSentrySettings({
            ...sentrySettings,
            provider
        });
    };

    const toggleSensor = (deviceId: string) => {
        const monitored = new Set(sentrySettings.monitored_device_ids);
        if (monitored.has(deviceId)) {
            monitored.delete(deviceId);
        } else {
            monitored.add(deviceId);
        }

        setSentrySettings({
            ...sentrySettings,
            monitored_device_ids: Array.from(monitored)
        });
    };

    const saveSettings = async () => {
        const response = await openapiFetchClient.PUT("/sentry/settings", {
            body: sentrySettings
        });

        if (!response.response.ok || !response.data) {
            setDialogStatus("error");
            setDialogMessage(t("ui_new.sentry.save_failed"));
            setDialogOpen(true);
            return;
        }

        queryClient.setQueryData(
            apiQueryClient.queryOptions("get", "/sentry/settings").queryKey,
            response.data
        );

        const currentState = useContentModel.getState().allThings;
        if (currentState) {
            setAllThings({
                ...currentState,
                sentry_settings: response.data as SentrySettings
            });
        }

        setDialogStatus("success");
        setDialogMessage(t("ui_new.sentry.save_success"));
        setDialogOpen(true);
    };

    const testNotification = async () => {
        const saveResponse = await openapiFetchClient.PUT("/sentry/settings", {
            body: sentrySettings
        });

        if (!saveResponse.response.ok) {
            setDialogStatus("error");
            setDialogMessage(t("ui_new.sentry.test_requires_valid_provider"));
            setDialogOpen(true);
            return;
        }

        const response = await openapiFetchClient.POST("/sentry/test");
        if (!response.response.ok) {
            setDialogStatus("error");
            setDialogMessage(t("ui_new.sentry.test_failed"));
            setDialogOpen(true);
            return;
        }

        queryClient.setQueryData(
            apiQueryClient.queryOptions("get", "/sentry/settings").queryKey,
            saveResponse.data ?? sentrySettings
        );

        setDialogStatus("success");
        setDialogMessage(t("ui_new.sentry.test_success"));
        setDialogOpen(true);
    };

    const telegramProvider = asTelegramProvider(sentrySettings);
    const webhookProvider = asWebhookProvider(sentrySettings);

    return <PageComponent title={t("ui_new.sentry.page_title")} to="/settings">
        <AlertDialog open={dialogOpen} setOpen={setDialogOpen} msg={dialogMessage} status={dialogStatus}/>
        <div className="space-y-4 p-4 md:p-6">
            <PageBox
                title={t("ui_new.sentry.hero_title")}
                description={t("ui_new.sentry.hero_subtitle")}
            />

            <PageBox variant="gray" title={t("ui_new.sentry.mode_title")} description={t("ui_new.sentry.mode_description")}/>
            <PageBox>
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={sentrySettings.enabled}
                        onCheckedChange={(checked) => {
                            setSentrySettings({
                                ...sentrySettings,
                                enabled: checked === true
                            });
                        }}
                    />
                    <div>
                        <div className="font-medium text-slate-900">
                            {sentrySettings.enabled ? t("ui_new.sentry.armed") : t("ui_new.sentry.disarmed")}
                        </div>
                        <div className="text-sm text-slate-500">{t("ui_new.sentry.mode_hint")}</div>
                    </div>
                    <div className="ml-auto text-cyan-700">
                        {sentrySettings.enabled ? <ShieldCheck size={20}/> : <ShieldAlert size={20}/>}
                    </div>
                </div>
            </PageBox>

            <PageBox variant="gray" title={t("ui_new.sentry.provider_title")} description={t("ui_new.sentry.provider_description")}/>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PageBox
                    title={t("ui_new.sentry.provider_telegram")}
                    description={t("ui_new.sentry.provider_telegram_description")}
                    onClick={() => updateProvider(asTelegramProvider({
                        ...sentrySettings,
                        provider: telegramProvider
                    }))}
                    selected={sentrySettings.provider.kind === "telegram"}
                >
                    <div className="inline-flex items-center gap-2 text-sm text-cyan-700">
                        <Bot size={16}/>
                        Telegram
                    </div>
                </PageBox>
                <PageBox
                    title={t("ui_new.sentry.provider_webhook")}
                    description={t("ui_new.sentry.provider_webhook_description")}
                    onClick={() => updateProvider(asWebhookProvider({
                        ...sentrySettings,
                        provider: webhookProvider
                    }))}
                    selected={sentrySettings.provider.kind === "webhook"}
                >
                    <div className="inline-flex items-center gap-2 text-sm text-cyan-700">
                        <Globe size={16}/>
                        Webhook
                    </div>
                </PageBox>
            </div>

            {sentrySettings.provider.kind === "telegram" && <PageBox>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>{t("ui_new.sentry.telegram_bot_token")}</Label>
                        <Input
                            value={telegramProvider.bot_token}
                            onChange={(event) => updateProvider({
                                ...telegramProvider,
                                bot_token: event.target.value
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t("ui_new.sentry.telegram_chat_id")}</Label>
                        <Input
                            value={telegramProvider.chat_id}
                            onChange={(event) => updateProvider({
                                ...telegramProvider,
                                chat_id: event.target.value
                            })}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>{t("ui_new.sentry.telegram_thread_id")}</Label>
                        <Input
                            value={telegramProvider.message_thread_id ?? ""}
                            onChange={(event) => updateProvider({
                                ...telegramProvider,
                                message_thread_id: event.target.value.trim().length === 0
                                    ? null
                                    : Number.parseInt(event.target.value, 10) || null
                            })}
                        />
                    </div>
                </div>
            </PageBox>}

            {sentrySettings.provider.kind === "webhook" && <PageBox>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label>{t("ui_new.sentry.webhook_url")}</Label>
                        <Input
                            value={webhookProvider.url}
                            onChange={(event) => updateProvider({
                                ...webhookProvider,
                                url: event.target.value
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t("ui_new.sentry.webhook_bearer_token")}</Label>
                        <Input
                            value={webhookProvider.bearer_token}
                            onChange={(event) => updateProvider({
                                ...webhookProvider,
                                bearer_token: event.target.value
                            })}
                        />
                    </div>
                </div>
            </PageBox>}

            <PageBox variant="gray" title={t("ui_new.sentry.sensors_title")} description={t("ui_new.sentry.sensors_description")}/>
            <PageBox>
                {availableSensors.length === 0 && (
                    <div className="text-sm text-slate-500">{t("ui_new.sentry.no_supported_sensors")}</div>
                )}
                {availableSensors.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-sm text-slate-500">{t("ui_new.sentry.sensors_hint")}</div>
                        {availableSensors.map((device) => (
                            <label key={device.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                                <Checkbox
                                    checked={sentrySettings.monitored_device_ids.includes(device.id)}
                                    onCheckedChange={() => toggleSensor(device.id)}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{device.config.name}</div>
                                    <div className="text-sm text-slate-500">{device.locationData?.config.name ?? t("ui_new.states.unknown_location")}</div>
                                </div>
                                <DoorOpen size={18} className="text-cyan-700"/>
                            </label>
                        ))}
                    </div>
                )}
            </PageBox>

            <div className="flex flex-col gap-3 pt-2">
                <PrimaryButton filled onClick={testNotification}>
                    <span className="inline-flex items-center gap-2"><BellRing size={16}/>{t("ui_new.sentry.test_notification")}</span>
                </PrimaryButton>
                <PrimaryButton filled onClick={saveSettings}>
                    {t("ui_new.common.save")}
                </PrimaryButton>
            </div>
        </div>
    </PageComponent>;
};

export const SentryPage = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={6}/>}>
            <SentryPageContent/>
        </Suspense>
    );
};
