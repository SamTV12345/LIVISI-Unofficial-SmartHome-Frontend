import {useParams} from "react-router";
import {useContentModel} from "@/src/store.tsx";
import {useEffect, useState} from "react";
import {Device} from "@/src/models/Device.ts";
import {ArrowLeft, Power} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import axios from "axios";
import {ACTION_ENDPOINT} from "@/src/constants/FieldConstants.ts";

export const DeviceDetailPage = ()=>{
    const params = useParams()
    const devices = useContentModel(state=>state.allThings)
    const [device,setDevice] = useState<Device>()
    const navigate = useNavigate()
    const [turnedOn, setTurnedOn] = useState<boolean>()

    useEffect(() => {
        if(devices){
            setDevice(devices.devices[params.id!])
        }
    }, []);


    useEffect(()=>{
        if (!device) return
            setTurnedOn(device!.capabilityState![0].state.onState.value)
    },[device])

    const constructSwitchPostModel = (newStatus: CapabilityState)=>{
        return {
            id: newStatus.id,
            target:"/capability/"+newStatus.id,
            namespace: device!.product,
            type: "SetState",
            params:{
                onState:{
                    type:"Constant",
                    value:  turnedOn
                }
            }
        }
    }

    useDebounce(()=>{
        if (!device) return
        const switchModel = constructSwitchPostModel(device.capabilityState![0])
        axios.post(ACTION_ENDPOINT,switchModel)
            .then(()=>{
                console.log('Switched')
            })
    },200,[turnedOn, device])

    return <div>
        <button onClick={() => navigate(-1)}><ArrowLeft/></button>
        <span className="flex">
        <h1 className="text-2xl ">{device?.config.name}</h1>
            <span className="flex-1"></span>
        <Power className={`rounded-full cursor-pointer border-gray-500 border-2 h-12 w-12 p-2 ${turnedOn?'bg-amber-300':''}`}  onClick={(e)=>{
            e.preventDefault()
            setTurnedOn(!turnedOn)}}/>
            </span>
        <h1 className="page-header">Auswertungen</h1>

        <h3 className="page-header">Szenarien</h3>


        <h3 className="page-header">Geräteinfo</h3>
        <p>Gerätename: {device?.config.modelId}</p>

    </div>
}
