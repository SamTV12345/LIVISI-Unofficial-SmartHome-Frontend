import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {useParams} from "react-router";
import {useEffect, useMemo, useState} from "react";
import {LocationResponse} from "@/src/models/Location.ts";
import {useContentModel} from "@/src/store.tsx";
import { Input } from "../components/actionComponents/Input";
import {LOCATION_ENDPOINT, TYPES} from "@/src/constants/FieldConstants.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import axios from "axios";
import {useTranslation} from "react-i18next";

export const LocationUpdateScreen = ()=>{
    const params = useParams()
    const [location, setLocation] = useState<LocationResponse>()
    const allthings = useContentModel(state=>state.allThings)
    const {t} = useTranslation()

    const memoizedDevices = useMemo(()=>{
        if (!location||!location.devices) return []

        return location.devices.map(v=>allthings?.devices[v]!).filter(v=>TYPES.includes(v.type))
    }, [location])


    useEffect(() => {
        if (!allthings) return
        allthings?.locations.filter(v=>v.id === params.id).map(v=>{
            setLocation(v)
        })
    }, [allthings]);

    return <PageComponent title={location?.config.name!}>
        <PageBox variant="gray" title="Ort ändern"/>
            <PageBox title="">
                <Input value={location?.config.name} onChange={()=>setLocation({
                    ...location!,
                    config:{
                        ...location?.config!,
                        name: location?.config.name!
                    }
                })}/>
            </PageBox>
        <PageBox title="Geräte im Bereich">
            <div className="sm:grid-cols-1 grid grid-cols-2 gap-3">{
                memoizedDevices.map(v=>{
                    return <DeviceDecider device={v!} key={v.id}/>
                })
            }</div>
        </PageBox>
        <div className="flex flex-col gap-5 m-3">
            <PrimaryButton onClick={async () => {
                await axios.put(LOCATION_ENDPOINT + "/" + location!.id, location)
            }}>{t('SaveChangesButtonCaption')}</PrimaryButton>
            <PrimaryButton status="error" onClick={async () => {
                await axios.delete(LOCATION_ENDPOINT + "/" + location!.id)
            }}>{t('DeleteLocationButtonTag')}</PrimaryButton>
        </div>
    </PageComponent>
}
