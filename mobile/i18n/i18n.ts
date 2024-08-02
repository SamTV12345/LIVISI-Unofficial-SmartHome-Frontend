import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Set the key-value pairs for the different languages you want to support.
const i18n = new I18n({
    de:{
        "lightingid": "Beleuchtung",
        "climateid": "Klima",
        "securityid": "Sicherheit",
        "doorsid": "Türen",
        "outsideid": "Außen",
        "energyid": "Energie",
        "householdid": "Haushalt",
        "healthid": "Gesundheit",
        "entertainmentid": "Unterhaltung",
        "statesid": "Zustände",
        "sign-in": "Login",
        "PSS": "Zwischenstecker",
        "PSSO": "Zwischenstecker Outdoor",
        "WDS": "Fensterkontakt",
        "WSD2": "Rauchmelder",
        "WSC2": "Wandsender",
        "VRCC": "Heizkörperthermostat",
    },
});
i18n.enableFallback = true;

// Set the locale once at the beginning of your app.
i18n.locale = <string>getLocales()[0].languageCode ?? 'de';
console.log(getLocales()[0].languageCode)
export default i18n