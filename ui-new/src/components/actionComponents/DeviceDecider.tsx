import {Heatingdevice} from "@/src/components/actionComponents/Heatingdevice.tsx";
import {OnOffDevce} from "@/src/components/actionComponents/OnOffDevice.tsx";
import {HEATING, ZWISCHENSTECKER} from "@/src/constants/FieldConstants.ts";
import {Device} from "@/src/models/Device.ts";
import {FC} from "react";
import {WandSender} from "@/src/components/actionComponents/WandSender.tsx";

type DeviceDeciderProps = {
    device: Device
}
export const DeviceDecider:FC<DeviceDeciderProps> = ({ device }) => {
    if (device.type === ZWISCHENSTECKER) {
        return <OnOffDevce device={device}/>;
    }
    if (device.type === HEATING) {
        return <Heatingdevice device={device}/>;
    }
    return <WandSender device={device}/>;
}
