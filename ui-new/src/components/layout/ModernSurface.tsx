import {ReactNode} from "react";
import {cn} from "@/src/utils/cn-helper.ts";

export type HeroBadge = {
    label: string,
    icon?: ReactNode
}

export type HeroStat = {
    label: string,
    value: ReactNode
}

type ModernHeroProps = {
    title: string,
    subtitle?: string,
    badges?: HeroBadge[],
    stats?: HeroStat[],
    actionSlot?: ReactNode,
    className?: string
}

type ModernSectionProps = {
    title: string,
    description?: ReactNode,
    icon?: ReactNode,
    actionSlot?: ReactNode,
    children: ReactNode,
    className?: string
}

export const ModernHero = ({title, subtitle, badges = [], stats = [], actionSlot, className}: ModernHeroProps) => {
    return (
        <div className={cn("relative overflow-hidden rounded-2xl border border-cyan-900/20 bg-gradient-to-br from-[#12518b] via-[#1d6c88] to-[#2f8a6b] p-5 text-white md:p-6", className)}>
            <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl"/>
            <div className="pointer-events-none absolute -bottom-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-lime-100/10 blur-2xl"/>

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start">
                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{title}</h2>
                    {subtitle && <p className="text-sm text-white/85 md:text-base">{subtitle}</p>}
                    {badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-sm">
                            {badges.map((badge) => (
                                <span
                                    key={badge.label}
                                    className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-3 py-1"
                                >
                                    {badge.icon}
                                    {badge.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {actionSlot && <div className="md:ml-auto">{actionSlot}</div>}
            </div>

            {stats.length > 0 && (
                <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-black/15 p-3 backdrop-blur-sm">
                            <div className="text-xs uppercase tracking-wide text-white/70">{stat.label}</div>
                            <div className="mt-1 text-sm font-semibold">{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ModernSection = ({title, description, icon, actionSlot, children, className}: ModernSectionProps) => {
    return (
        <div className={cn("rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900", className)}>
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-700">
                {icon}
                <div className="font-semibold text-gray-900 dark:text-slate-100">{title}</div>
                {description && <div className="text-sm text-gray-500 dark:text-slate-300">{description}</div>}
                {actionSlot && <div className="ml-auto">{actionSlot}</div>}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
};
