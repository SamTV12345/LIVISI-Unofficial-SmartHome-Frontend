import React, {FC} from "react";
import {useNavigate} from "react-router-dom";
import {Check, ChevronRight} from "lucide-react";
import {cn} from "@/src/utils/cn-helper.ts";

export type PageBoxProps = {
    children?: React.ReactNode
    title?: string
    description?: React.ReactNode,
    to?: string,
    variant?: "default" | "gray",
    onClick?: () => void,
    selected?: boolean,
    className?: string
}

export const PageBox: FC<PageBoxProps> = ({description, title, className, selected, onClick, children, to, variant}) => {
    const navigate = useNavigate();
    const isClickable = Boolean(to || onClick);

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
        if (onClick) {
            onClick();
        }
    };

    return <div
        className={cn(
            "relative rounded-xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900",
            variant === "gray" && "bg-gray-50 dark:bg-slate-950",
            isClickable && "cursor-pointer transition hover:-translate-y-[1px] hover:border-cyan-200 hover:shadow-[0_14px_28px_rgba(8,47,73,0.08)] dark:hover:border-cyan-700/60",
            className
        )}
        onClick={handleClick}
    >
        {title && (
            <div className="pr-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            </div>
        )}
        {description && (
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {description}
            </div>
        )}
        {to && <ChevronRight className="absolute right-4 top-4 text-gray-400 dark:text-slate-500"/>}
        {selected && <Check className="absolute right-4 top-4 text-emerald-600"/>}
        {children && title && <div className="mt-3">{children}</div>}
        {children && !title && <div>{children}</div>}
    </div>
}
