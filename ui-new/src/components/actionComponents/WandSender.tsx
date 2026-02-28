import {Device} from "@/src/models/Device.ts";
import {FC, useMemo} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {LayoutGrid, Radio, Zap} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {formatTime} from "@/src/utils/timeUtils.ts";

type WandSenderProps = {
    device: Device
}

export const WandSender: FC<WandSenderProps> = ({device}) => {
    const navigate = useNavigate();

    const capabilityCount = (device.capabilityState ?? []).length;
    const latestChange = useMemo(() => {
        let latest: string | undefined = undefined;
        for (const capability of device.capabilityState ?? []) {
            for (const stateValue of Object.values(capability.state ?? {})) {
                const changed = (stateValue as { lastChanged?: string })?.lastChanged;
                if (!changed) {
                    continue;
                }
                if (!latest || changed > latest) {
                    latest = changed;
                }
            }
        }
        return latest;
    }, [device.capabilityState]);

    return <Card key={device.id} className="cursor-pointer" onClick={() => {
        navigate('/devices/' + device.id)
    }}>
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {device.locationData && <CardDescription>{device.locationData?.config.name}</CardDescription>}
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        Wandtaster
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {capabilityCount} Capabilities
                    </span>
                </div>
            </div>
            <span className="flex-1"></span>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-violet-200 bg-violet-100 text-violet-700">
                <Zap size={20}/>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-gray-200 bg-white p-2 text-center">
                        <div className="inline-flex items-center gap-1 text-xs text-slate-500"><LayoutGrid size={12}/>Typ</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{device.type}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white p-2 text-center">
                        <div className="inline-flex items-center gap-1 text-xs text-slate-500"><Radio size={12}/>Letztes Event</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{latestChange ? formatTime(latestChange) : "-"}</div>
                    </div>
                </div>
                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
                    Dieser Wandsender steuert Szenarien oder gekoppelte Aktionen.
                </div>
            </div>
        </CardContent>
    </Card>
}
