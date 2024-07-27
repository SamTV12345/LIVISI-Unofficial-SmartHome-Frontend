import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {useContentModel} from "@/src/store.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";

export const LANPage = ()=>{
    const allthings = useContentModel(state=>state.allThings)

    return <PageComponent title="LAN" to="/settings">
        <PageBox>
        <div className="grid grid-cols-2">
            <div>MAC</div>
            <div>{allthings?.status.network.ethMacAddress}</div>
            <div>IP</div>
            <div>{allthings?.status.network.ethIpAddress}</div>
            <div>Status</div>
            <div>{allthings?.status.network.ethCableAttached&& 'Verbunden'}</div>
        </div>
        </PageBox>
    </PageComponent>
}
