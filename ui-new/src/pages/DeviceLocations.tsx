import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useContentModel} from "@/src/store.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {LocationResponse} from "@/src/models/Location.ts";
import {TYPES} from "@/src/constants/FieldConstants.ts";
import {Plus} from "lucide-react";
import {Suspense, useState} from "react";
import {PortalDialog} from "@/src/components/actionComponents/PortalDialog.tsx";
import {apiQueryClient} from "@/src/api/openapiClient.ts";
import {PageSkeleton} from "@/src/components/layout/PageSkeleton.tsx";
import {useTranslation} from "react-i18next";

const DeviceLocationsContent = () => {
    const allthings = useContentModel((state) => state.allThings);
    const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
    const {t} = useTranslation();
    const {data: locationsResponse} = apiQueryClient.useSuspenseQuery("get", "/location");
    const locations = (locationsResponse as LocationResponse[] | undefined) ?? [];

    const formatTitle = (locationResponse: LocationResponse) => {
        let filteredDevices: string[] = []
        if (locationResponse.devices !== undefined){
            filteredDevices = locationResponse.devices?.filter(v=>{
                return TYPES.includes(allthings?.devices[v].type!)
            })
        }
        return `${locationResponse.config.name}  (${filteredDevices.length})`
    };


    const AddDialogComponent = () => {
        return <PortalDialog setDeviceDialogOpen={setDeviceDialogOpen} deviceDialogOpen={deviceDialogOpen} title={t("ui_new.locations.add_title")} description={t("ui_new.locations.add_description")}>
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">
                {t("ui_new.locations.add_form_todo")}
            </div>
        </PortalDialog>
    };

    return <PageComponent title={t("ui_new.locations.page_title")} to="/settings" actionButton={<button onClick={()=>{
        setDeviceDialogOpen(true)
    }}>
        <Plus/>
    </button>}>
        <div className="space-y-4 p-4 md:p-6">
            {
                locations.map((v)=> {
                    return <PageBox key={v.id} title={formatTitle(v)} to={"/settings/deviceLocations/"+v.id}/>
                })
            }
            <AddDialogComponent/>
        </div>
    </PageComponent>
};

export const DeviceLocations = () => {
    return (
        <Suspense fallback={<PageSkeleton cards={5}/>}>
            <DeviceLocationsContent/>
        </Suspense>
    );
};
