import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useContentModel} from "@/src/store.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {LocationResponse} from "@/src/models/Location.ts";
import {LOCATION_ENDPOINT, TYPES} from "@/src/constants/FieldConstants.ts";
import {Plus} from "lucide-react";
import {useState} from "react";
import {PortalDialog} from "@/src/components/actionComponents/PortalDialog.tsx";
import {SubmitHandler, useForm} from "react-hook-form";
import axios from "axios";

export const DeviceLocations = ()=>{
    const allthings = useContentModel(state=>state.allThings)
    const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
    //const [deviceToEdit, setDeviceToEdit] = useState<LocationResponse | undefined>(undefined)
    const formatTitle = (locationResponse: LocationResponse)=>{
        let filteredDevices: string[] = []
        if (locationResponse.devices !== undefined){
            filteredDevices = locationResponse.devices?.filter(v=>{
                return TYPES.includes(allthings?.devices[v].type!)
            })
        }
        return `${locationResponse.config.name}  (${filteredDevices.length})`
    }


    const AddDialogComponent = ()=>{

        type DeviceLoc = {
            name: string,
                type: string
        }

        const {handleSubmit} = useForm<DeviceLoc>()

        const onSubmit: SubmitHandler<DeviceLoc> = (data)=>{
            axios.post(LOCATION_ENDPOINT, data)
        }


        return <PortalDialog setDeviceDialogOpen={setDeviceDialogOpen} deviceDialogOpen={deviceDialogOpen} title="Ort hinzufügen" description="Fügt einen Ort zur besseren Übersicht hinzu">
            <form onSubmit={handleSubmit(onSubmit)}>

            </form>
        </PortalDialog>
    }

    return <PageComponent title={"Gerätestandorte"} actionButton={<button onClick={()=>{
        setDeviceDialogOpen(true)
    }}>
        <Plus/>
    </button>}>
        {
            allthings?.locations.map((v)=> {
                return <PageBox title={formatTitle(v)} to={"/settings/deviceLocations/"+v.id}/>
            })
        }
        <AddDialogComponent/>
    </PageComponent>
}
