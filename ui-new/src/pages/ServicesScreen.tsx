import {PageComponent} from "@/src/components/actionComponents/PageComponent.tsx";
import {PageBox} from "@/src/components/actionComponents/PageBox.tsx";
import {useTranslation} from "react-i18next";

export const ServicesScreen = ()=>{
    const {t} = useTranslation()

    return <PageComponent title="Dienste">
        <PageBox title="Mobiler Zugang" description="Gültig (kostenfrei)" to="/services/mobile-access"/>
        <PageBox title="Sonnenauf-/-untergang" description={t('SmartCode.ServiceDetails.ControlSelectedDevices')!}/>
        <PageBox title="SMS" description={0 +" "+t('SmartCode.ServiceDetails.SMSRemaining')}/>
    </PageComponent>
}
