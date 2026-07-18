import {Device} from "@/src/models/Device.ts";
import {FC, useMemo} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import {Thermometer} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

type RadiatorThermostatDeviceProps = {
    device: Device,
    showRoom: boolean
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

// LIVISI RST: read-only here, setpoint is controlled via the room climate device (VRCC).
export const RadiatorThermostatDevice: FC<RadiatorThermostatDeviceProps> = ({device, showRoom}) => {
    const navigate = useNavigate();
    const {t} = useTranslation();

    const temperature = useMemo(() => readNumberFromState(device, "temperature"), [device]);
    // ponytail: field names pointTemperature/setpointTemperature/valvePosition unverified against a real RST payload
    const setpoint = useMemo(() => readNumberFromState(device, "setpointTemperature") ?? readNumberFromState(device, "pointTemperature"), [device]);
    const valvePosition = useMemo(() => readNumberFromState(device, "valvePosition"), [device]);

    const fields = [
        typeof temperature === "number" && {label: t("ui_new.radiator.temperature"), value: `${temperature.toFixed(1)} °C`},
        typeof setpoint === "number" && {label: t("ui_new.radiator.setpoint"), value: `${setpoint.toFixed(1)} °C`},
        typeof valvePosition === "number" && {label: t("ui_new.radiator.valve_position"), value: `${Math.round(valvePosition)} %`}
    ].filter((field): field is {label: string, value: string} => !!field);

    return <Card key={device.id} className="cursor-pointer" onClick={() => navigate('/devices/' + device.id)}>
        <CardHeader className="flex flex-row items-start gap-3">
            <div className="space-y-1">
                <CardTitle className="text-xl">{device.config.name}</CardTitle>
                {showRoom && <CardDescription>{device.locationData?.config.name}</CardDescription>}
            </div>
            <span className="flex-1"></span>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700">
                <Thermometer size={20}/>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
                {fields.map((field) => (
                    <div key={field.label} className="rounded-md border border-gray-200 p-2">
                        <div className="text-xs text-slate-500">{field.label}</div>
                        <div className="font-semibold text-slate-900">{field.value}</div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-xs text-slate-500">{t("ui_new.radiator.controlled_via_room_climate")}</div>
        </CardContent>
    </Card>
}
