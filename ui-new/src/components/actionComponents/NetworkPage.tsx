import {useContentModel} from "@/src/store.tsx";
import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";

export const NetworkPage = ()=>{
    const allthings = useContentModel(state=>state.allThings)



    return <><PageComponent to={"/settings"} title="Netzwerk">
        {
            allthings?.status.network.inUseAdapter == "eth"? <>
            <PageBox variant="default">
                <div className="flex justify-center">
                <img className="network-img" src="/images/svg_single/connected_wired.svg" alt="Shows the shc to be connected via wire"/>
                </div>
            </PageBox>
                <PageBox description="Ihre Zentrale ist mit dem Internet über das LAN-Kabel verbunden!" variant="gray"/>
                <PageBox title="LAN" description="Verbunden" variant="default" to="/settings/lan"/>
            </>:<>
                <PageBox variant="default">
                    <div className="flex justify-center">
                        <img className="network-img" src="/images/svg_single/connected_wireless.svg"
                             alt="Shows the shc to be connected via wireless"/>
                    </div>
                </PageBox>
                <PageBox description="Ihre Zentrale ist mit dem Internet über WLAN verbunden!" variant="gray"/>
                <PageBox title="WLAN" description="Verbunden" variant="default"/>
            </>
        }
    </PageComponent>
        <div className="flex gap-4 flex-col p-5">
            <PrimaryButton onClick={()=>{}}>WI-FI Verbindung über WPS</PrimaryButton>
            <PrimaryButton onClick={()=>{}}>Zu WLAN wechseln</PrimaryButton>
        </div>
    </>
}
