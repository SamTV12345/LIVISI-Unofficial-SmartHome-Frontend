import {Component, ReactNode} from "react";

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
                        Ein unerwarteter Fehler ist aufgetreten. Bitte Seite neu laden.
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
