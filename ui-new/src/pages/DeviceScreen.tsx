import {useMemo, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {Accordion} from "@radix-ui/react-accordion";
import {TYPES} from "@/src/constants/FieldConstants.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {useTranslation} from "react-i18next";
import {Device} from "@/src/models/Device.ts";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";

export const DeviceScreen = ()=>{
    const [selectedTab, setSelectedTab] = useState<number>(0)
    const allDevices = useContentModel(state=>state.allThings)

    const mappedDevicesToType = useMemo(() => {
        if (!allDevices?.devices) return undefined
        console.log("Mapping")
        const map = new Map<string, Device[]>
        TYPES.forEach(type=>{
            map.set(type,[])
        })
        for (const devDevice of Object.entries(allDevices?.devices!)) {
                map.get(devDevice[1].type!)?.push(devDevice[1])
        }
        return map
    }, [allDevices?.devices]);

    const {t} = useTranslation()
    return         <PageComponent title={t('HouseholdIdDevicesTag')}>
        <div className="grid grid-cols-2">
        <div className={`${selectedTab===0&&'border-b-8 border-cyan-600'} text-center text-xl mb-3 border-b border-black `} onClick={()=>setSelectedTab(0)}>Ort</div>
        <div className={`${selectedTab===1&&'border-b-8 border-cyan-600'} text-center  border-b border-black text-xl mb-3`} onClick={()=>setSelectedTab(1)}>Gerätetyp</div>
        {selectedTab===0&&<div className="col-span-2">
        {
            allDevices?.locations&& Object.entries(allDevices?.locations!).map(([_,location])=>{
                return        <Accordion type="single" collapsible className="rounded-3xl" key={location.id}>
                    <AccordionItem value="beleuchtung" className="text-black rounded">
                        <AccordionTrigger className="text-center ml-2">{location.config.name}</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-2 gap-4">
                                {location.devices?.filter(device=>{
                                    return TYPES.includes(allDevices?.devices[device].type!)
                                })
                                    .map(device=>{
                                        return <DeviceDecider device={allDevices?.devices[device]!} key={device}/>
                                    })
                                }
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            })
        }
    </div>}
        {selectedTab===1&&<div className="col-span-2">
            {
                                <div className="">
                                    {mappedDevicesToType &&[...mappedDevicesToType.entries()]
                                        .map(([key, dev])=>{
                                            return <Accordion type="single" collapsible className="rounded-3xl" key={key}>
                                            <AccordionItem value="beleuchtung" className="text-black rounded">
                                                <AccordionTrigger className="text-center ml-2">{t(key)}</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {
                                                            dev!.map(device=>{
                                                                console.log(device)
                                                                return <DeviceDecider device={device} key={device.id}/>
                                                            })
                                                        }
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                        })
                                    }
                                </div>
            }
        </div>}
        </div></PageComponent>
}
