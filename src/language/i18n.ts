import i18n from 'i18next'
import {initReactI18next} from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

const resources = {
    de: {
       translation:{
           messages: "Nachrichten",
           dashboard: "Dashboard",
           devices: "Geräte",
           locations: "Orte",
           scenarios: "Szenarios",
           status: "Status",
           message:'Nachricht',
           time: 'Zeit',
           messageLocalAccessActivated: 'Die lokale Smarthome-Funktionalität wurde aktiviert. Sie können eine Verbindung herstellen, indem Sie in Ihrem Webbrowser die folgende URL aufrufen: http://{{ip}}/ aufrufen.',
           messageSHCUpdateCompleted: 'Ihre Zentrale wurde erfolgreich aktualisiert.'
       }
    },
    en:{
        translation:{
            messages: "Messages",
            dashboard: "Dashboard",
            devices: "Devices",
            locations: "Locations",
            scenarios: "Scenarios",
            status: "Status",
            message:'Message',
            time:'Time',

            messageLocalAccessActivated: 'The local smarthome functionality has been activated. You can connect by going to the following URL in your web browser: http://{{ip}}/',
            messageSHCUpdateCompleted: 'Your control panel has been successfully updated.'
        }
    }
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(
        {
            resources
        }
    )

export default i18n