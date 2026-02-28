import {View, Text, TextInput, ScrollView, RefreshControl} from "react-native";
import {ListItemIsland} from "@/components/ListItemIsland";
import {ListItemDescription} from "@/components/ListItemDescription";
import {Link} from "@/components/Link";
import {ListItemInfo} from "@/components/ListItemInfo";
import {ListItemInput} from "@/components/ListItemInput";
import {SafeAreaView} from "react-native-safe-area-context";
import {ListItemInfoOutside} from "@/components/ListItemInfoOutside";
import {useContentModel} from "@/store/store";
import {useEffect, useState} from "react";
import {ListItemInfoHeading} from "@/components/ListItemInfoHeading";
import {ListItemList} from "@/components/ListItemList";
import {useAllThingsRefresh} from "@/hooks/useAllThingsRefresh";
import {ErrorBanner} from "@/components/ErrorBanner";

export type EmailConfig = {
    server_address: string,
    server_port_number: number,
    email_username: string,
    email_password: string,
    recipient_list: string[]
    notifications_device_unreachable: boolean,
    notification_device_low_battery: boolean,
}

export default function () {
    const allthings = useContentModel(state=>state.allThings)
    const [emailConfig, setEmailConfig] = useState<EmailConfig>()
    const {refreshing, refreshError, refreshAllThings} = useAllThingsRefresh();

    const updateEmailConfig = (nextConfig: EmailConfig) => {
        setEmailConfig(nextConfig);
        const currentAllThings = useContentModel.getState().allThings;
        if (currentAllThings) {
            useContentModel.getState().setAllThings({
                ...currentAllThings,
                email: nextConfig
            });
        }
    };
    const withEmailConfig = (updater: (current: EmailConfig) => EmailConfig) => {
        if (!emailConfig) {
            return;
        }
        updateEmailConfig(updater(emailConfig));
    };

    useEffect(() => {
        if (!allthings) return
        setEmailConfig(allthings.email)

    }, [allthings]);


    return <SafeAreaView>
        <ScrollView
            overScrollMode="never"
            style={{display: 'flex', flexDirection: 'column', gap: 10}}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                void refreshAllThings();
            }}/>}
        >
        {refreshError && <ErrorBanner message={refreshError} onRetry={() => {
            void refreshAllThings();
        }}/>}
        {!emailConfig && <ErrorBanner message="E-Mail-Konfiguration wird geladen."/>}
        <ListItemDescription title="Info" description={<Text>Dieses Binding ermöglicht eine direkte Verbindung der Zentrale zum SMTP Server des
            bevorzugten E-Mail Providers. Die Daten zur SMTP-Serveradresse, dem Port usw. müssen beim jeweiligen
            Provider erfragt werden.
            Hilfe zu diesem Binding findest Du am schnellsten in unserer  <Link href="https://lsh.community">Community</Link>
        </Text>
        }>
        </ListItemDescription>
        <ListItemIsland style={{marginTop: 20}}>
            <ListItemInput title="SMTP-Serveradresse" onChange={(v)=>{
                withEmailConfig((current) => ({
                    ...current,
                    server_address: v
                }));
            }}  value={emailConfig?emailConfig.server_address: ''}></ListItemInput>
        </ListItemIsland>

            <ListItemInfoOutside>
                Geben Sie die SMTP-Serveradresse Deines Providers ein.
                In den meisten Fällen ist dies eine Adresse der Form „smtp.deintolleranbieter.de"
            </ListItemInfoOutside>

            <ListItemIsland style={{marginTop: 20}}>
                <ListItemInput title="SMTP-Port" onChange={(v)=>{
                    withEmailConfig((current) => ({
                        ...current,
                        server_port_number: Number.isNaN(parseInt(v)) ? 0 : parseInt(v)
                    }));
                }}  value={emailConfig?String(emailConfig.server_port_number): ''}></ListItemInput>
            </ListItemIsland>

            <ListItemInfoOutside>
                Geben Sie den Port des SMTP-Servers ein. Normalerweise ist dies 465 oder 587.
            </ListItemInfoOutside>

            <ListItemIsland style={{marginTop: 20}}>
                <ListItemInput title="Benutzername" onChange={(v)=>{
                    withEmailConfig((current) => ({
                        ...current,
                        email_username: v
                    }));
                }}  value={emailConfig?String(emailConfig.email_username): ''}></ListItemInput>
            </ListItemIsland>

            <ListItemInfoOutside>
                Benutzername für die Authentifizierung gegenüber dem SMTP-Server. Dies ist in der Regel Deine E-Mail-Adresse.
            </ListItemInfoOutside>

            <ListItemIsland style={{marginTop: 20}}>
                <ListItemInput title="Passwort" secureTextEntry={true} onChange={(v)=>{
                    withEmailConfig((current) => ({
                        ...current,
                        email_password: v
                    }));
                }}  value={emailConfig?String(emailConfig.email_password): ''}></ListItemInput>
            </ListItemIsland>

            <ListItemInfoOutside>
                Gib das Passwort für die Authentifizierung gegenüber dem SMTP-Server ein.
            </ListItemInfoOutside>

            <ListItemInfoHeading>Empfänger</ListItemInfoHeading>
            <ListItemIsland>
                <ListItemList values={emailConfig?emailConfig.recipient_list:[]} onChange={(v)=>{
                    withEmailConfig((current) => ({
                        ...current,
                        recipient_list: v
                    }));
                }} addNewItemText={"Neuen Empfänger hinzufügen"}/>
            </ListItemIsland>
        </ScrollView>
    </SafeAreaView>
}
