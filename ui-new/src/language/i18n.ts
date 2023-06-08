import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import de_translation from './json/de.json'
import en_translation from './json/en.json'
import fr_translation from './json/fr.json'

const resources = {
    de: {
        translation:de_translation
    },
    en:{
        translation: en_translation
    },
    fr:{
        translation: fr_translation
    }
}

i18n
    .use(LanguageDetector)
    .init({
            resources
        })
export {i18n as i18next}
