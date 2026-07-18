import {Device} from "@/src/models/Device.ts";
import {FC, MouseEvent, useCallback, useEffect, useMemo, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";
import {ArrowDown, ArrowUp, Blinds, Square} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {postJson} from "@/src/api/httpClient.ts";
import {useTranslation} from "react-i18next";

type ShutterDeviceProps = {
    device: Device,
    showRoom: boolean
}

// LIVISI RollerShutterActuator: shutterLevel 0-100 (100 = fully open). Up/Down via StartRamp, precise position via SetState.
export const ShutterDevice: FC<ShutterDeviceProps> = ({device, showRoom}) => {
    const navigate = useNavigate();
    const {t} = useTranslation();

    const shutterCapability = useMemo(() => {
        return (device.capabilityState ?? []).find((capability) => typeof capability.state?.shutterLevel?.value === "number");
    }, [device.capabilityState]);
    const levelFromStore = shutterCapability ? Number(shutterCapability.state?.shutterLevel?.value) : undefined;

    const [level, setLevel] = useState<number>(levelFromStore ?? 0);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!pending && typeof levelFromStore === "number") {
            setLevel(levelFromStore);
        }
    }, [levelFromStore, pending]);

    // ponytail: device.product is the namespace (same CoSIP actuator family as the switch). Adjust here if a real ISR2 rejects it.
    const namespace = device.product;

    const sendRamp = useCallback((event: MouseEvent, type: "StartRamp" | "StopRamp", direction?: "RampUp" | "RampDown") => {
        event.stopPropagation();
        if (!shutterCapability) {
            return;
        }
        setError(undefined);
        postJson(ACTION_ENDPOINT, {
            id: shutterCapability.id,
            target: CAPABILITY_PREFIX + shutterCapability.id,
            type,
            namespace,
            ...(direction ? {params: {rampDirection: {type: "Constant", value: direction}}} : {})
        }).catch(() => setError(t("ui_new.shutter.move_failed")));
    }, [shutterCapability, namespace, t]);

    useEffect(() => {
        if (!shutterCapability || levelFromStore === undefined || level === levelFromStore) {
            return;
        }
        const timeout = setTimeout(() => {
            setPending(true);
            setError(undefined);
            postJson(ACTION_ENDPOINT, {
                id: shutterCapability.id,
                target: CAPABILITY_PREFIX + shutterCapability.id,
                type: "SetState",
                namespace,
                params: {shutterLevel: {type: "Constant", value: Math.round(level)}}
            }).catch(() => {
                setError(t("ui_new.shutter.position_save_failed"));
            }).finally(() => setPending(false));
        }, 700);
        return () => clearTimeout(timeout);
    }, [shutterCapability, namespace, levelFromStore, level, t]);

    const buttonClass = "inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-sm font-semibold text-slate-700 hover:bg-gray-100 disabled:opacity-50";

    return <Card key={device.id} className="cursor-pointer" onClick={() => navigate('/devices/' + device.id)}>
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {showRoom && <CardDescription>{device.locationData?.config.name}</CardDescription>}
                <CardDescription>{t("ui_new.shutter.position")}: {Math.round(level)} % ({level <= 0 ? t("ui_new.shutter.closed") : t("ui_new.shutter.opened")})</CardDescription>
            </div>
            <span className="flex-1"></span>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-sky-700">
                <Blinds size={20}/>
            </div>
        </CardHeader>
        <CardContent>
            <div
                className="flex gap-2"
                onClick={(event) => event.stopPropagation()}
            >
                <button type="button" className={buttonClass} disabled={!shutterCapability} onClick={(e) => sendRamp(e, "StartRamp", "RampUp")}>
                    <ArrowUp size={16}/>{t("ui_new.shutter.open")}
                </button>
                <button type="button" className={buttonClass} disabled={!shutterCapability} onClick={(e) => sendRamp(e, "StopRamp")}>
                    <Square size={16}/>{t("ui_new.shutter.stop")}
                </button>
                <button type="button" className={buttonClass} disabled={!shutterCapability} onClick={(e) => sendRamp(e, "StartRamp", "RampDown")}>
                    <ArrowDown size={16}/>{t("ui_new.shutter.close")}
                </button>
            </div>
            <div
                className="mt-4"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <SliderCDN max={100} min={0} step={1} value={[level]} onValueChange={(value) => setLevel(value[0])}/>
            </div>
            <div className="mt-2 text-xs text-slate-500">{pending ? t("ui_new.dimmer.saving") : t("ui_new.dimmer.auto_saved")}</div>
            {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
        </CardContent>
    </Card>
}
