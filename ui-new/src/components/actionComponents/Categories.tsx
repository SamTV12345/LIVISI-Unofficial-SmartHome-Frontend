import {AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {Device} from "@/src/models/Device.ts";
import {FC} from "react";
import {UserStorage} from "@/src/models/UserStorage.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {useTranslation} from "react-i18next";

type CategoriesProps = {
    userStorage: UserStorage
}

export const Category:FC<CategoriesProps> = ({userStorage})=>{
            const {t} = useTranslation()

            return <AccordionItem value={userStorage.key} className="rounded">
                <AccordionTrigger className="text-center ml-2">{t(userStorage.key.toLowerCase())}</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 p-2">
                        {userStorage.devices&&userStorage.devices.map((device: Device)=><DeviceDecider key={device.id} device={device}/>)}
                    </div>
                </AccordionContent>
            </AccordionItem>
}
