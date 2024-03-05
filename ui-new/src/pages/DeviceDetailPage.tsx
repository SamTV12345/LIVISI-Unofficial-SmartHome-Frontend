import {useParams} from "react-router";
import {useContentModel} from "@/src/store.tsx";
import {useEffect, useState} from "react";
import {Device} from "@/src/models/Device.ts";
import {ArrowLeft, Power} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {CapabilityState} from "@/src/models/CapabilityState.ts";
import {useDebounce} from "@/src/utils/useDebounce.ts";
import axios from "axios";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/src/constants/FieldConstants.ts";

export const DeviceDetailPage = ()=>{
    const params = useParams()
    const devices = useContentModel(state=>state.devices)
    const [device,setDevice] = useState<Device>()
    const navigate = useNavigate()
    const mapOfStates = useContentModel(state => state.mapOfStates)
    const [state, setState] = useState<CapabilityState>()
    const [turnedOn, setTurnedOn] = useState<boolean>()

    useEffect(() => {
        if(devices){
            setDevice(devices.find(d=>d.id===params.id))
        }
    }, []);


    useEffect(()=>{
        if (!device) return
        device.capabilities.forEach(c=>{
            const currentState = mapOfStates.get(c)
            if(currentState && currentState.state &&currentState.state.onState){
                setState(currentState)
                setTurnedOn(currentState.state.onState.value as boolean)
            }
        })
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
        if(state){
            const switchModel = constructSwitchPostModel(state)
            axios.post(ACTION_ENDPOINT,switchModel)
                .then(()=>{
                    // @ts-ignore
                    mapOfStates.get(CAPABILITY_PREFIX+state.id).state.onState.value = turnedOn
                })
        }
    },2000,[turnedOn])

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
