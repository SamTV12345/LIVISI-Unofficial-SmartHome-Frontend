import {useContentModel} from "@/src/store.tsx";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";

export const WLANPage = ()=>{
    const allthings = useContentModel(state=>state.allThings)

    return <PageComponent title="WLAN" to="/settings">
            <PageBox>
                <div className="grid grid-cols-2">
                    <div>MAC</div>
                    <div>{allthings?.status.network.wifiMacAddress}</div>
                    <div>IP</div>
                    <div>{allthings?.status.network.wifiIpAddress}</div>
                    <div>Status</div>
                    <div>{allthings?.status.network.wifiActiveSsid !== undefined&& 'Verbunden'}</div>
                </div>
            </PageBox>
        </PageComponent>
}
