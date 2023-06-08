import {Device} from "@/src/models/Device.ts";
import {FC} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/layout/Card.tsx";
import switchSVG from '@/src/assets/Switch.svg'

type WandSenderProps = {
    device: Device
}

export const WandSender:FC<WandSenderProps> = ({ device }) => {
    return <Card key={device.id} className={`cursor-pointer`}>
        <CardHeader className="grid place-items-center">
            <CardTitle className="text-xl">{device.config.name}</CardTitle>
            {device.locationData&&<CardDescription>{device.locationData?.config.name}</CardDescription>}
        </CardHeader>
        <CardContent>
            <div className="grid place-items-center">
                <img src={switchSVG} alt="switch"/>
            </div>
        </CardContent>
    </Card>
}
