import React, {FC} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowLeft} from 'lucide-react'

type PageComponentProps = {
    children: React.ReactNode
    to?: string,
    title: string,
    actionButton?: React.ReactNode
}

export const PageComponent: FC<PageComponentProps> = ( {children, to, title, actionButton})=>{
    const navigate = useNavigate()

    return <div className="pb-6">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur md:px-6 dark:border-slate-700 dark:bg-slate-950/80">
            {to && (
                <button
                    type="button"
                    className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => navigate(to)}
                    aria-label="Zurück"
                >
                    <ArrowLeft className="h-4 w-4"/>
                </button>
            )}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {actionButton && (
                <>
                    <div className="flex-1"></div>
                    <div className="self-center">{actionButton}</div>
                </>
            )}
        </div>
        {children}
    </div>
}
