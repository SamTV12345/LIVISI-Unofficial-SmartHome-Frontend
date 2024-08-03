import {FC} from "react";
import {Device} from "@/models/Device";
import {
    FENSTERKONTAKT,
    HEATING,
    RAUCHMELDER,
    ZWISCHENSTECKER,
    ZWISCHENSTECKER_OUTDOOR
} from "@/constants/FieldConstants";
import {OnOffDevice} from "@/components/OnOffDevice";
import {Heatingdevice} from "@/components/Heatingdevice";
import {WindowContactDevice} from "@/components/WindowContactDevice";
import {WandSender} from "@/components/WandSender";
import {SmokeDetector} from "@/components/SmokeDetector";

type DeviceDeciderProps = {
    device: Device
}

export const DeviceDecider:FC<DeviceDeciderProps> = ({ device })=>{
    if (device.type === ZWISCHENSTECKER) {
        return <OnOffDevice device={device} showRoom={false}/>;
    }
    if (device.type === ZWISCHENSTECKER_OUTDOOR) {
        return <OnOffDevice device={device} showRoom={true}/>;
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
    return <WandSender device={device} key={device.id} showRoom={true}/>;
}