import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";

export const MobileAccessScreen = ()=>{
    function resizeIframe(obj: any) {
        obj.style.height = obj.contentWindow.document.documentElement.scrollHeight + 'px';
        obj.style.width = '100%';
        obj.style.height = '900px';
        obj.style.scale = '0.1';
    }
    return <PageComponent title="Mobiler Zugang" to="/settings">
        <iframe                 style={{ width: '100%' }}
                                 scrolling="no" onLoad={(e)=>resizeIframe(e.target)}
                src="/resources/SystemAccess.innogy/2.0.10/innogy/ani_services-system_access_2048x360.html"></iframe>
    </PageComponent>
}
