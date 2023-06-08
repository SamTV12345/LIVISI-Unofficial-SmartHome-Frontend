import {useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {AccordionContent, AccordionItem, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {Accordion} from "@radix-ui/react-accordion";
import {TYPES} from "@/src/constants/FieldConstants.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";

export const DeviceScreen = ()=>{
    const [selectedTab, setSelectedTab] = useState<number>(0)
    const locations = useContentModel(state => state.locations)

    return <div className="grid grid-cols-2">
        <div className={`${selectedTab===0&&'border-b-8 border-cyan-600'} text-center `} onClick={()=>setSelectedTab(0)}>Ort</div>
        <div className={`${selectedTab===1&&'border-b-8 border-cyan-600'} text-center  border-b border-black`} onClick={()=>setSelectedTab(1)}>Gerätetyp</div>
        {selectedTab===0&&<div className="col-span-2">
        {
            locations.map(location=>{
                return        <Accordion type="single" collapsible className="rounded-3xl">
                    <AccordionItem value="beleuchtung" className="text-black rounded">
                        <AccordionTrigger className="text-center ml-2">{location.config.name}</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-2 gap-4">
                                {location.devices?.filter(device=>TYPES.includes(device.type))
                                    .map(device=><DeviceDecider device={device}/>)}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            })
        }
    </div>}
    </div>
}
