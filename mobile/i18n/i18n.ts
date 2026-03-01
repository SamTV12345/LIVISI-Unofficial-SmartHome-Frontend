import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    de: {
        translation: {
            lightingid: "Beleuchtung",
            climateid: "Klima",
            securityid: "Sicherheit",
            doorsid: "Türen",
            outsideid: "Außen",
            energyid: "Energie",
            householdid: "Haushalt",
            healthid: "Gesundheit",
            entertainmentid: "Unterhaltung",
            statesid: "Zustände",
            "sign-in": "Login",
            PSS: "Zwischenstecker",
            PSSO: "Zwischenstecker Outdoor",
            WDS: "Fensterkontakt",
            WSD2: "Rauchmelder",
            WSC2: "Wandsender",
            VRCC: "Heizkörperthermostat"
        }
    }
} as const;

const locale = getLocales()[0]?.languageCode ?? "de";

void i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: "de",
    interpolation: {
        escapeValue: false
    },
    returnNull: false
});

export default i18n;
