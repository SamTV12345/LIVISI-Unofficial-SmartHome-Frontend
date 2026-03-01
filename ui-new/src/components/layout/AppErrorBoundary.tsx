import {Component, ReactNode} from "react";
import {i18next} from "@/src/language/i18n.ts";

type AppErrorBoundaryProps = {
    children: ReactNode
}

type AppErrorBoundaryState = {
    hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    constructor(props: AppErrorBoundaryProps) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(): AppErrorBoundaryState {
        return {hasError: true};
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6">
                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                        {i18next.t("ui_new.app_error.unexpected")}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
