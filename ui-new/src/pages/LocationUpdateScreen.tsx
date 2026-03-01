import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {useParams} from "react-router";
import {Suspense, useEffect, useMemo, useState} from "react";
import {LocationResponse} from "@/src/models/Location.ts";
import {Device} from "@/src/models/Device.ts";
import {useContentModel} from "@/src/store.tsx";
import { Input } from "../components/actionComponents/Input";
import {TYPES} from "@/src/constants/FieldConstants.ts";
import {DeviceDecider} from "@/src/components/actionComponents/DeviceDecider.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {useTranslation} from "react-i18next";
import {apiQueryClient, openapiFetchClient} from "@/src/api/openapiClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {useNavigate} from "react-router-dom";

const LocationUpdateScreenContent = () => {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const setAllThings = useContentModel((state) => state.setAllThings);
    const [location, setLocation] = useState<LocationResponse>();
    const allthings = useContentModel((state)=>state.allThings);
    const {t} = useTranslation();
    const locationId = params.id;

    const {data: locationResponse} = apiQueryClient.useSuspenseQuery("get", "/location/{id}", {
        params: {
            path: {id: locationId ?? ""}
        }
    });

    const memoizedDevices = useMemo(()=>{
        if (!location||!location.devices) return []

        return location.devices
            .map((deviceId) => allthings?.devices[deviceId])
            .filter((device): device is Device => device !== undefined && TYPES.includes(device.type));
    }, [allthings?.devices, location]);


    useEffect(() => {
        if (!locationResponse) return;
        setLocation(locationResponse as LocationResponse);
    }, [locationResponse]);

    if (!locationId) {
        return <PageComponent title={t("ui_new.location_update.edit_title")} to="/settings/deviceLocations">
            <div className="space-y-4 p-4 md:p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{t("ui_new.location_update.location_id_missing")}</div>
            </div>
        </PageComponent>;
    }

    return <PageComponent title={location?.config.name || t("ui_new.location_update.edit_title")} to="/settings/deviceLocations">
        <div className="space-y-4 p-4 md:p-6">
            <PageBox variant="gray" title={t("ui_new.location_update.rename_title")}/>
                <PageBox title="">
                    <Input value={location?.config.name} onChange={(event)=>setLocation({
                        ...location,
                        config:{
                            ...location?.config,
                            name: event.target.value
                        }
                    } as LocationResponse)}/>
                </PageBox>
            <PageBox title={t("ui_new.location_update.devices_in_area")}>
                <div className="sm:grid-cols-1 grid grid-cols-2 gap-3">{
                    memoizedDevices.map(v=>{
                        return <DeviceDecider device={v!} key={v.id}/>
                    })
                }</div>
            </PageBox>
            <div className="flex flex-col gap-5 pt-2">
                <PrimaryButton onClick={async () => {
                    if (!location) return;
                    const response = await openapiFetchClient.PUT("/location/{id}", {
                        params: {
                            path: {id: location.id}
                        },
                        body: location
                    });
                    if (response.error || !response.data) return;

                    const currentState = useContentModel.getState().allThings;
                    if (currentState) {
                        setAllThings({
                            ...currentState,
                            locations: currentState.locations.map((entry) => entry.id === location.id ? location : entry)
                        });
                    }
                }}>{t('SaveChangesButtonCaption')}</PrimaryButton>
                <PrimaryButton status="error" onClick={async () => {
                    if (!location) return;
                    const response = await openapiFetchClient.DELETE("/location/{id}", {
                        params: {
                            path: {id: location.id}
                        }
                    });
                    if (response.error) return;

                    const currentState = useContentModel.getState().allThings;
                    if (currentState) {
                        setAllThings({
                            ...currentState,
                            locations: currentState.locations.filter((entry) => entry.id !== location.id)
                        });
                    }
                    navigate("/settings/deviceLocations");
                }}>{t('DeleteLocationButtonTag')}</PrimaryButton>
            </div>
        </div>
    </PageComponent>
};

export const LocationUpdateScreen = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={4}/>}>
            <LocationUpdateScreenContent/>
        </Suspense>
    );
};
