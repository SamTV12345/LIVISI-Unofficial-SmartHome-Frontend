export const CAPABILITY_PREFIX = '/capability/'
export const CAPABILITY_FULL_PATH = "/capability/states"

export const INTERACTION_PREFIX = '/interaction'

export const USER_STORAGE_FULL_PATH = "/userstorage"

export const HOME_PAGE_DEVIVE_VISIBILITY = "HomepageDeviceVisibility"

export const TOTAL_THINGS_TO_LOAD = 7

export const CATEGORY = 'CategoryOrderAndVisibility'


export const HEATING = 'VRCC'
export const RADIATOR_THERMOSTAT = "RST"

export const WANDSENDER = "WSC2"

export const ZWISCHENSTECKER = "PSS"
export const ZWISCHENSTECKER_OUTDOOR = "PSSO"
export const FENSTERKONTAKT = "WDS"

export const RAUCHMELDER = "WSD2"

// In-wall light switch actuator (ISS2 = newer hardware revision of ISS); both expose an onState boolean like PSS.
export const LICHTSCHALTER = "ISS"
export const LICHTSCHALTER_2 = "ISS2"

export const DIMMER = "ISD2"
export const ROLLLADEN = "ISR2"
// Motion detector (WMDO = outdoor variant); both are read-only sensors (MotionDetectionSensor + LuminanceSensor).
export const BEWEGUNGSMELDER = "WMD"
export const BEWEGUNGSMELDER_OUTDOOR = "WMDO"

export const TYPES = [WANDSENDER, ZWISCHENSTECKER, HEATING, RADIATOR_THERMOSTAT, ZWISCHENSTECKER_OUTDOOR, FENSTERKONTAKT, RAUCHMELDER, LICHTSCHALTER, LICHTSCHALTER_2, DIMMER, ROLLLADEN, BEWEGUNGSMELDER, BEWEGUNGSMELDER_OUTDOOR]

export const ACTION_ENDPOINT = '/action'
export const LOCATION_ENDPOINT = '/location'


