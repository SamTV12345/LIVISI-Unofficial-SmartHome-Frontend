import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {Accordion, AccordionTrigger} from "@/src/components/actionComponents/Accordion.tsx";
import {AccordionContent, AccordionItem} from "@radix-ui/react-accordion";
import {useMemo, useState} from "react";
import {useContentModel} from "@/src/store.tsx";
import {Device} from "@/src/models/Device.ts";
import axios, {AxiosResponse} from "axios";
import TimeSeriesChart, {DataPoint} from "@/src/components/layout/TimeSeriesChart.tsx";


/*
Indoor Smart Plug (PSS)
Inwall Switch (ISSx)
Outdoor Smart Plug (PSSO)
Room Heating Control (VRCC) that includes support for physical heating devices such as Radiator Thermostat (RSTx), Room Thermostat (WRT) or Floor Heating Control (FSC8)
Wall Switches (ISS, ISS2)
Window-Door Sensor (WDS)
 */

type CapData = {
    eventType: string,
    eventTime: string,
    dataName: string,
    dataValue: string
    entityId: string
}

export const HomeScreen = ()=>{
    const allthings = useContentModel(state=>state.allThings)
    const [deviceDataStore, setDeviceDataStore] = useState<Map<string,DataPoint[]>>(new Map<string, DataPoint[]>())

    const roomsClimate = useMemo(()=>{
        let deviceArrays: Device[] = []
        if (!allthings?.devices) return deviceArrays
        deviceArrays = Object.values(allthings?.devices).filter((d)=>{
            return d.type === "VRCC"
        })
        return deviceArrays || []
    }, [allthings?.devices])


    const loadObject = (device: Device, mapkey: string, capKey: string)=>{
        const currentDate = new Date().toISOString()
        const start = new Date()
        start.setHours(start.getHours()-24)
        axios.get('/data/capability', {
            params:{
                entityId: device.manufacturer+"."+device.type+"."+device.serialNumber+capKey,
                start: start.toISOString(),
                end: currentDate,
                page: 1,
                pagesize: 100,
                eventType: "StateChanged"
            }
        }).then((v: AxiosResponse<CapData[]>)=>{

            const data = v.data.map((v)=>{
                return {
                    timeString: v.eventTime,
                    value: parseFloat(v.dataValue)
                }
            })

            setDeviceDataStore((prev)=>{
                return new Map(prev.set(device.id+mapkey, data))
            })
        })
    }

    const loadDeviceData = (device: Device)=>{
        if (!deviceDataStore.has(device.id+"temp")){
            loadObject(device, "temp", ".RoomTemperature")
        }

        if (!deviceDataStore.has(device.id+"humidity")){
            loadObject(device, "humidity", ".RoomHumidity")
        }


    }

    return <PageComponent title="Home">
        <Accordion type="single" collapsible className="rounded-3xl" key={"Räume"}>
            {
                roomsClimate.map(r=>{
                   return <AccordionItem value={r.locationData?.config.name ?? ''} className="text-black rounded" key={r.locationData?.config.name}>
                        <AccordionTrigger className="text-center ml-2" onClick={()=>{
                            loadDeviceData(r)
                        }}>{r.locationData?.config.name}</AccordionTrigger>
                        <AccordionContent>
                            {
                                deviceDataStore.has(r.id+'temp')&&<TimeSeriesChart chartTitle={"Temperatur in "+r.locationData?.config.name} ytitle="Temperatur in Grad" data={deviceDataStore.get(r.id+"temp") ||[]} />
                            }
                            {
                                deviceDataStore.has(r.id+'humidity')&&<TimeSeriesChart chartTitle={"Feuchtigkeit in "+r.locationData?.config.name} ytitle="Temperatur in Grad" data={deviceDataStore.get(r.id+"humidity") || []} />
                            }
                        </AccordionContent>
                    </AccordionItem>
                })
            }
        </Accordion>
    </PageComponent>

}
