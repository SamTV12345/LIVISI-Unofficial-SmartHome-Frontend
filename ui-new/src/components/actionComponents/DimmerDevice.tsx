import {Device} from "@/src/models/Device.ts";
import {FC, useEffect, useMemo, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";
import {Lightbulb, Power} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {postJson} from "@/src/api/httpClient.ts";
import {useTranslation} from "react-i18next";

type DimmerDeviceProps = {
    device: Device,
    showRoom: boolean
}

// LIVISI DimmerActuator exposes a dimLevel (0-100). onState-only switches use OnOffDevice instead.
export const DimmerDevice: FC<DimmerDeviceProps> = ({device, showRoom}) => {
    const navigate = useNavigate();
    const {t} = useTranslation();

    const dimCapability = useMemo(() => {
        return (device.capabilityState ?? []).find((capability) => typeof capability.state?.dimLevel?.value === "number");
    }, [device.capabilityState]);
    const levelFromStore = dimCapability ? Number(dimCapability.state?.dimLevel?.value) : undefined;

    const [level, setLevel] = useState<number>(levelFromStore ?? 0);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!pending && typeof levelFromStore === "number") {
            setLevel(levelFromStore);
        }
    }, [levelFromStore, pending]);

    useEffect(() => {
        if (!dimCapability || levelFromStore === undefined || level === levelFromStore) {
            return;
        }
        const timeout = setTimeout(() => {
            setPending(true);
            setError(undefined);
            postJson(ACTION_ENDPOINT, {
                id: dimCapability.id,
                target: CAPABILITY_PREFIX + dimCapability.id,
                type: "SetState",
                // ponytail: same CoSIP actuator family as the switch, so device.product ("CosipDevices.RWE") is the namespace. Adjust here if a real ISD2 rejects it.
                namespace: device.product,
                params: {
                    dimLevel: {
                        type: "Constant",
                        value: Math.round(level)
                    }
                }
            }).catch(() => {
                setError(t("ui_new.dimmer.save_failed"));
            }).finally(() => {
                setPending(false);
            });
        }, 700);
        return () => clearTimeout(timeout);
    }, [device.product, dimCapability, levelFromStore, level, t]);

    const isOn = level > 0;

    return <Card key={device.id} className="cursor-pointer" onClick={() => navigate('/devices/' + device.id)}>
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {showRoom && <CardDescription>{device.locationData?.config.name}</CardDescription>}
            </div>
            <span className="flex-1"></span>
            <button
                type="button"
                disabled={!dimCapability || pending}
                aria-label={isOn ? t("ui_new.dimmer.switch_off") : t("ui_new.dimmer.switch_on")}
                onClick={(event) => {
                    event.stopPropagation();
                    setLevel(isOn ? 0 : 100);
                }}
                className={"inline-flex h-12 w-12 items-center justify-center rounded-full border " + (isOn
                    ? "border-amber-300 bg-amber-100 text-amber-600"
                    : "border-slate-200 bg-slate-100 text-slate-500") + (pending ? " opacity-70" : "")}
            >
                <Power size={18}/>
            </button>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Lightbulb size={14}/>
                    {t("ui_new.dimmer.brightness")}
                    <span className="ml-auto text-2xl font-semibold text-slate-900">{Math.round(level)} %</span>
                </div>
                <div
                    className="mt-4"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <SliderCDN
                        max={100}
                        min={0}
                        step={1}
                        value={[level]}
                        onValueChange={(value) => setLevel(value[0])}
                    />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                    {pending ? t("ui_new.dimmer.saving") : t("ui_new.dimmer.auto_saved")}
                </div>
                {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
            </div>
        </CardContent>
    </Card>
}
