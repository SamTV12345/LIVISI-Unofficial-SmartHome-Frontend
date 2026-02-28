import {Device} from "@/src/models/Device.ts";
import {FC, useEffect, useMemo, useState} from "react";
import {Thermometer, Waves} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";
import {formatTime} from "@/src/utils/timeUtils.ts";
import {useNavigate} from "react-router-dom";
import {postJson} from "@/src/api/httpClient.ts";

type HeatingdeviceProps = {
    device: Device
}

const readNumberFromState = (device: Device, key: string): number | undefined => {
    for (const capability of device.capabilityState ?? []) {
        const value = capability.state?.[key]?.value;
        if (typeof value === "number") {
            return value;
        }
    }
    return undefined;
};

const readLatestChangedFromState = (device: Device): string | undefined => {
    let latest: string | undefined = undefined;
    for (const capability of device.capabilityState ?? []) {
        for (const stateValue of Object.values(capability.state ?? {})) {
            const changed = (stateValue as { lastChanged?: string })?.lastChanged;
            if (!changed || changed.startsWith("1970-01-01T00:00:00")) {
                continue;
            }
            if (!latest || changed > latest) {
                latest = changed;
            }
        }
    }
    return latest;
};

export const Heatingdevice: FC<HeatingdeviceProps> = ({device}) => {
    const navigate = useNavigate();

    const setpointCapability = useMemo(() => {
        return (device.capabilityState ?? []).find((capability) => typeof capability.state?.setpointTemperature?.value === "number");
    }, [device.capabilityState]);

    const setpointFromStore = useMemo(() => readNumberFromState(device, "setpointTemperature"), [device]);
    const currentTemperature = useMemo(() => readNumberFromState(device, "temperature"), [device]);
    const humidity = useMemo(() => readNumberFromState(device, "humidity"), [device]);
    const latestEvent = useMemo(() => readLatestChangedFromState(device), [device]);

    const [setpointValue, setSetpointValue] = useState<number>(setpointFromStore ?? 20);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!pending && typeof setpointFromStore === "number") {
            setSetpointValue(setpointFromStore);
        }
    }, [setpointFromStore, pending]);

    useEffect(() => {
        if (!setpointCapability || setpointFromStore === undefined || setpointValue === setpointFromStore) {
            return;
        }

        const timeout = setTimeout(() => {
            setPending(true);
            setError(undefined);

            postJson(ACTION_ENDPOINT, {
                target: CAPABILITY_PREFIX + setpointCapability.id,
                type: "SetState",
                namespace: "core." + device.manufacturer,
                params: {
                    setpointTemperature: {
                        type: "Constant",
                        value: Number(setpointValue)
                    }
                }
            }).catch(() => {
                setError("Solltemperatur konnte nicht gespeichert werden.");
            }).finally(() => {
                setPending(false);
            });
        }, 700);

        return () => {
            clearTimeout(timeout);
        };
    }, [device.manufacturer, setpointCapability, setpointFromStore, setpointValue]);

    return <Card
        key={device.id}
        className="cursor-pointer"
        onClick={() => {
            navigate('/devices/' + device.id);
        }}
    >
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {device.locationData && <CardDescription>{device.locationData?.config.name}</CardDescription>}
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800">
                        Ist: {typeof currentTemperature === "number" ? `${currentTemperature.toFixed(1)} °C` : "-"}
                    </span>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        Feuchte: {typeof humidity === "number" ? `${Math.round(humidity)} %` : "-"}
                    </span>
                    <span className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        Letztes Event: {latestEvent ? formatTime(latestEvent) : "-"}
                    </span>
                </div>
            </div>
            <span className="flex-1"></span>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700">
                <Thermometer size={20}/>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <Thermometer size={14}/>
                        Solltemperatur
                    </div>
                    <div className="ml-auto text-2xl font-semibold text-slate-900">{setpointValue.toFixed(1)} °C</div>
                </div>
                <div
                    className="mt-4"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <SliderCDN
                        max={30}
                        min={6.5}
                        step={0.5}
                        value={[setpointValue]}
                        onValueChange={(value) => {
                            setSetpointValue(value[0]);
                        }}
                    />
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>6.5 °C</span>
                        <span>30.0 °C</span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                    {pending ? "Speichere..." : "Automatisch gespeichert"}
                </div>
                {error && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                        <Waves size={12}/>
                        {error}
                    </div>
                )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md border border-gray-200 p-2 text-center">
                    <div className="text-xs text-slate-500">Soll</div>
                    <div className="font-semibold text-slate-900">{setpointValue.toFixed(1)} °C</div>
                </div>
                <div className="rounded-md border border-gray-200 p-2 text-center">
                    <div className="text-xs text-slate-500">Ist</div>
                    <div className="font-semibold text-slate-900">{typeof currentTemperature === "number" ? `${currentTemperature.toFixed(1)} °C` : "-"}</div>
                </div>
                <div className="rounded-md border border-gray-200 p-2 text-center">
                    <div className="text-xs text-slate-500">Feuchte</div>
                    <div className="font-semibold text-slate-900">{typeof humidity === "number" ? `${Math.round(humidity)} %` : "-"}</div>
                </div>
            </div>
        </CardContent>
    </Card>
}
