import {Device} from "@/src/models/Device.ts";
import {FC, useMemo} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {Radar, Sun} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {formatTime} from "@/src/utils/timeUtils.ts";

type MotionDeviceProps = {
    device: Device,
    showRoom: boolean
}

// LIVISI WMD/WMDO: read-only sensor. MotionDetectionSensor (motionDetectedCount, event-based) + LuminanceSensor (luminance %).
export const MotionDevice: FC<MotionDeviceProps> = ({device, showRoom}) => {
    const navigate = useNavigate();
    const {t} = useTranslation();

    const luminance = useMemo(() => {
        for (const capability of device.capabilityState ?? []) {
            const value = capability.state?.luminance?.value;
            if (typeof value === "number") {
                return value;
            }
        }
        return undefined;
    }, [device.capabilityState]);

    const lastMotion = useMemo(() => {
        for (const capability of device.capabilityState ?? []) {
            const changed = capability.state?.motionDetectedCount?.lastChanged as string | undefined;
            if (changed && !changed.startsWith("1970-01-01T00:00:00")) {
                return changed;
            }
        }
        return undefined;
    }, [device.capabilityState]);

    return <Card key={device.id} className="cursor-pointer" onClick={() => navigate('/devices/' + device.id)}>
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {showRoom && <CardDescription>{device.locationData?.config.name}</CardDescription>}
            </div>
            <span className="flex-1"></span>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700">
                <Radar size={20}/>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-gray-200 p-2">
                    <div className="inline-flex items-center gap-1 text-xs text-slate-500"><Sun size={12}/>{t("ui_new.motion.brightness")}</div>
                    <div className="font-semibold text-slate-900">{typeof luminance === "number" ? `${Math.round(luminance)} %` : "-"}</div>
                </div>
                <div className="rounded-md border border-gray-200 p-2">
                    <div className="text-xs text-slate-500">{t("ui_new.motion.last_motion")}</div>
                    <div className="font-semibold text-slate-900">{lastMotion ? formatTime(lastMotion) : "-"}</div>
                </div>
            </div>
        </CardContent>
    </Card>
}
