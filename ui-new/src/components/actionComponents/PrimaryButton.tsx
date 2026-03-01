import React, {FC} from "react";
import {cn} from "@/src/utils/cn-helper.ts";

type PrimaryButtonProps = {
    children: React.ReactNode
    onClick: () => void
    className?: string
    disabled?: boolean,
    filled?: boolean,
    status?: "success" | "error" | "warning",
    type?: "button" | "submit" | "reset"
}

const statusClasses: Record<NonNullable<PrimaryButtonProps["status"]>, {filled: string, outline: string}> = {
    success: {
        filled: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500",
        outline: "border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
    },
    error: {
        filled: "border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500",
        outline: "border-red-600 bg-white text-red-700 hover:bg-red-50 dark:border-red-500 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-slate-800"
    },
    warning: {
        filled: "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 dark:border-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400",
        outline: "border-amber-500 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-400 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
    }
};

export const PrimaryButton: FC<PrimaryButtonProps> = ({disabled, onClick, className, status = "success", children, filled = false, type = "button"}) => {
    const styles = statusClasses[status];

    return <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
            "inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition",
            filled ? styles.filled : styles.outline,
            disabled && "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500 hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-800",
            className
        )}
    >
        {children}
    </button>
}
