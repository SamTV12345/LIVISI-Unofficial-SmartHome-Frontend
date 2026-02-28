import {Device} from "@/src/models/Device.ts";
import {FC, MouseEvent, useCallback, useEffect, useMemo, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";
import {Power} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {cn} from "@/src/utils/cn-helper.ts";
import {postJson} from "@/src/api/httpClient.ts";

type OnOffDeviceProps = {
    device: Device,
    showRoom: boolean
}

export const OnOffDevice: FC<OnOffDeviceProps> = ({device, showRoom = false}) => {
    const navigate = useNavigate();
    const onStateCapability = useMemo(() => {
        return (device.capabilityState ?? []).find((capability) => typeof capability.state?.onState?.value === "boolean");
    }, [device.capabilityState]);
    const onStateFromStore = onStateCapability ? Boolean(onStateCapability.state?.onState?.value) : false;

    const [turnedOn, setTurnedOn] = useState<boolean>(onStateFromStore);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!pending) {
            setTurnedOn(onStateFromStore);
        }
    }, [onStateFromStore, pending]);

    const toggleState = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!onStateCapability || pending) {
            return;
        }

        const previousValue = turnedOn;
        const nextValue = !turnedOn;
        setTurnedOn(nextValue);
        setPending(true);
        setError(undefined);

        try {
            await postJson(ACTION_ENDPOINT, {
                id: onStateCapability.id,
                target: CAPABILITY_PREFIX + onStateCapability.id,
                namespace: device.product,
                type: "SetState",
                params: {
                    onState: {
                        type: "Constant",
                        value: nextValue
                    }
                }
            });
        } catch {
            setTurnedOn(previousValue);
            setError("Schaltvorgang fehlgeschlagen.");
        } finally {
            setPending(false);
        }
    }, [device.product, onStateCapability, pending, turnedOn]);

    return <Card key={device.id} onClick={() => navigate('/devices/' + device.id)}>
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {showRoom && <CardDescription>{device.locationData?.config.name}</CardDescription>}
                <span className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                    turnedOn
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                )}>
                    {turnedOn ? "An" : "Aus"}
                </span>
            </div>
            <span className="flex-1"></span>
            <button
                type="button"
                onClick={(event) => {
                    void toggleState(event);
                }}
                disabled={!onStateCapability || pending}
                className={cn(
                    "relative mt-1 inline-flex h-10 w-24 items-center rounded-full border px-1 transition",
                    turnedOn
                        ? "border-emerald-400 bg-emerald-100"
                        : "border-slate-300 bg-slate-100",
                    pending && "cursor-not-allowed opacity-70",
                    !onStateCapability && "cursor-not-allowed opacity-40"
                )}
                aria-label={turnedOn ? "Ausschalten" : "Einschalten"}
            >
                <span
                    className={cn(
                        "absolute text-[10px] font-bold tracking-wide",
                        turnedOn ? "left-3 text-emerald-700/40" : "right-3 text-slate-500/70"
                    )}
                >
                    {turnedOn ? "AN" : "AUS"}
                </span>
                <span
                    className={cn(
                        "absolute left-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white text-slate-700 shadow-sm transition-transform",
                        turnedOn && "translate-x-14 border-emerald-700 bg-emerald-600 text-white"
                    )}
                >
                    <Power size={14}/>
                </span>
            </button>
        </CardHeader>
        {error && (
            <CardContent className="pt-0">
                <div className="text-xs text-red-600">{error}</div>
            </CardContent>
        )}
    </Card>
}
