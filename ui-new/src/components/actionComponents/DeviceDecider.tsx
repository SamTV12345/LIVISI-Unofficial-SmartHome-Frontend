import {Heatingdevice} from "@/src/components/actionComponents/Heatingdevice.tsx";
import {OnOffDevice} from "@/src/components/actionComponents/OnOffDevice.tsx";
import {
    BEWEGUNGSMELDER,
    BEWEGUNGSMELDER_OUTDOOR,
    DIMMER,
    FENSTERKONTAKT,
    HEATING,
    LICHTSCHALTER,
    LICHTSCHALTER_2,
    RADIATOR_THERMOSTAT,
    RAUCHMELDER,
    ROLLLADEN,
    WANDSENDER,
    ZWISCHENSTECKER,
    ZWISCHENSTECKER_OUTDOOR
} from "@/src/constants/FieldConstants.ts";
import {Device} from "@/src/models/Device.ts";
import {FC, ReactElement} from "react";
import {BatteryLow, WifiOff} from "lucide-react";
import {useTranslation} from "react-i18next";
import {WandSender} from "@/src/components/actionComponents/WandSender.tsx";
import {WindowContactDevice} from "@/src/components/actionComponents/WindowContactDevice.tsx";
import {SmokeDetector} from "@/src/components/actionComponents/SmokeDetector.tsx";
import {DimmerDevice} from "@/src/components/actionComponents/DimmerDevice.tsx";
import {ShutterDevice} from "@/src/components/actionComponents/ShutterDevice.tsx";
import {MotionDevice} from "@/src/components/actionComponents/MotionDevice.tsx";
import {RadiatorThermostatDevice} from "@/src/components/actionComponents/RadiatorThermostatDevice.tsx";

type DeviceDeciderProps = {
    device: Device
}
export const DeviceDecider:FC<DeviceDeciderProps> = ({ device }) => {
    const {t} = useTranslation();
    const component = getDeviceComponent(device);
    if (!component) {
        return null;
    }

    const isUnreachable = device.state?.isReachable?.value === false;
    const isBatteryLow = device.state?.isBatteryLow?.value === true;
    if (!isUnreachable && !isBatteryLow) {
        return component;
    }

    return <div className="relative" key={device.id}>
        {component}
        <span className="absolute left-3 top-2 z-10 flex gap-1">
            {isUnreachable && <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/60 dark:text-red-200">
                <WifiOff size={12}/>{t("ui_new.device_status.unreachable")}
            </span>}
            {isBatteryLow && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                <BatteryLow size={12}/>{t("ui_new.device_status.battery_low")}
            </span>}
        </span>
    </div>;
}

const getDeviceComponent = (device: Device): ReactElement | null => {
    if (device.type === RADIATOR_THERMOSTAT) {
        return <RadiatorThermostatDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === ZWISCHENSTECKER) {
        return <OnOffDevice device={device} key={device.id} showRoom={false}/>;
    }
    if (device.type === ZWISCHENSTECKER_OUTDOOR) {
        return <OnOffDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === LICHTSCHALTER || device.type === LICHTSCHALTER_2) {
        return <OnOffDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === DIMMER) {
        return <DimmerDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === ROLLLADEN) {
        return <ShutterDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === BEWEGUNGSMELDER || device.type === BEWEGUNGSMELDER_OUTDOOR) {
        return <MotionDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === FENSTERKONTAKT) {
        return  <WindowContactDevice device={device} key={device.id} showRoom={true}/>;
    }

    if (device.type === RAUCHMELDER) {
        return <SmokeDetector device={device} showRoom={true} key={device.id}/>
    }


    if (device.type === HEATING) {
        return <Heatingdevice device={device} key={device.id}/>;
    }

    if (device.type === WANDSENDER) {
        return <WandSender device={device} key={device.id}/>;
    }

    return null;
}
