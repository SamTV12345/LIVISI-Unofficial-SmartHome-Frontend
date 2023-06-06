import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/src/components/actionComponents/Accordion.tsx"
import {useContentModel} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import {Heatingdevice} from "@/src/components/actionComponents/Heatingdevice.tsx";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import {TOTAL_THINGS_TO_LOAD, ZWISCHENSTECKER} from "@/src/constants/FieldConstants.ts";
import {OnOffDevce} from "@/src/components/actionComponents/OnOffDevice.tsx";


/*
Indoor Smart Plug (PSS)
Inwall Switch (ISSx)
Outdoor Smart Plug (PSSO)
Room Heating Control (VRCC) that includes support for physical heating devices such as Radiator Thermostat (RSTx), Room Thermostat (WRT) or Floor Heating Control (FSC8)
Wall Switches (ISS, ISS2)
Window-Door Sensor (WDS)
 */
export const HomeScreen = ()=>{
    const mapOfDevices = useContentModel(state => state.mapOfDevices)
    const totalProgress = useContentModel(state=>state.loadingProgress)

    if (totalProgress < TOTAL_THINGS_TO_LOAD){
        return <LoadingScreen/>
    }

    return <>
        <Accordion type="single" collapsible className="rounded-3xl">
        <AccordionItem value="beleuchtung" className="bg-blue-600 text-white rounded">
            <AccordionTrigger className="text-center ml-2">Beleuchtung</AccordionTrigger>
            <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
        </AccordionItem>
            <AccordionItem value="klima" className="cyan text-white rounded">
                <AccordionTrigger className="ml-2">Klima</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 p-2">
                    {mapOfDevices.get(ZWISCHENSTECKER)?.map((device: Device)=><Heatingdevice device={device}/>)}
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sicherheit">
                <AccordionTrigger>Sicherheit</AccordionTrigger>
                <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="door&window">
                <AccordionTrigger>Türen & Fenster</AccordionTrigger>
                <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="outdoor">
                <AccordionTrigger>Draussen</AccordionTrigger>
                <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="energy">
                <AccordionTrigger>Energie</AccordionTrigger>
                <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="states">
                <AccordionTrigger>Zustand</AccordionTrigger>
                <AccordionContent>
                    <AccordionContent>
                        <div className="grid grid-cols-2 gap-4 p-2">
                            {mapOfDevices.get("PSS")?.map((device: Device)=><OnOffDevce device={device}/>)}
                        </div>
                    </AccordionContent>
                </AccordionContent>
            </AccordionItem>
    </Accordion>
    </>
}
