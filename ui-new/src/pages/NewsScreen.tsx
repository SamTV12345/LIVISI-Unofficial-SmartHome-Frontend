import {formatTime} from "@/src/utils/timeUtils.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {determineTitleAndDescription} from "@/src/utils/messageDetermining.ts";
import {ModernHero, ModernSection} from "@/src/components/layout/ModernSurface.tsx";
import {Bell, Circle, Mail} from "lucide-react";
import {Suspense, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {Message} from "@/src/models/Messages.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {useTranslation} from "react-i18next";

const NewsScreenContent = () => {
    const {t} = useTranslation();
    const {data: messagesResponse} = apiQueryClient.useSuspenseQuery("get", "/message");
    const messages = (messagesResponse as Message[] | undefined) ?? [];
    const navigate = useNavigate();

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }, [messages]);
    const unreadCount = sortedMessages.filter((message) => !message.read).length;

    return <PageComponent title={t("ui_new.news.page_title")}>
        <div className="space-y-5 p-4 md:p-6">
            <ModernHero
                title={t("ui_new.news.hero_title")}
                subtitle={t("ui_new.news.hero_subtitle")}
                badges={[
                    {label: t("ui_new.news.messages_count", {count: sortedMessages.length}), icon: <Mail size={14}/>},
                    {label: t("ui_new.news.unread_count", {count: unreadCount}), icon: <Bell size={14}/>}
                ]}
                stats={[
                    {label: t("ui_new.news.stats_total"), value: sortedMessages.length},
                    {label: t("ui_new.news.stats_unread"), value: unreadCount},
                    {label: t("ui_new.news.stats_read"), value: sortedMessages.length - unreadCount},
                    {label: t("ui_new.news.stats_latest"), value: sortedMessages[0] ? formatTime(sortedMessages[0].timestamp) : "-"}
                ]}
            />

            <ModernSection title={t("ui_new.news.section_title")} description={t("ui_new.news.section_description")}>
                {sortedMessages.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                        {t("ui_new.news.none")}
                    </div>
                )}
                {sortedMessages.length > 0 && (
                    <div className="space-y-3">
                        {sortedMessages.map((message) => {
                            const {title, description} = determineTitleAndDescription(message);
                            return (
                                <button
                                    key={message.id}
                                    type="button"
                                    onClick={() => navigate(`/news/${message.id}`)}
                                    className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-cyan-200 hover:bg-cyan-50/30"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1">
                                            <Circle size={10} className={message.read ? "text-gray-300" : "fill-[#86b919] text-[#86b919]"}/>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className={`text-base font-semibold ${message.read ? "text-slate-700" : "text-slate-900"}`}>{title}</div>
                                            <div className={`mt-1 text-sm ${message.read ? "text-slate-500" : "text-slate-600"}`}>{description}</div>
                                        </div>
                                        <span className="whitespace-nowrap text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </ModernSection>
        </div>
    </PageComponent>
};

export const NewsScreen = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={4}/>}>
            <NewsScreenContent/>
        </Suspense>
    );
};
