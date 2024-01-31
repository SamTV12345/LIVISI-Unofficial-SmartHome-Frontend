import {Accordion} from "@/src/components/actionComponents/Accordion.tsx"
import {useContentModel} from "@/src/store.tsx";
import {CATEGORY, TYPES} from "@/src/constants/FieldConstants.ts";
import {useMemo} from "react";
import {UserStorage} from "@/src/models/UserStorage.ts";
import {UserStorageValueShow} from "@/src/models/UserStorageHomepage.ts";
import {Category} from "@/src/components/actionComponents/Categories.tsx";


/*
Indoor Smart Plug (PSS)
Inwall Switch (ISSx)
Outdoor Smart Plug (PSSO)
Room Heating Control (VRCC) that includes support for physical heating devices such as Radiator Thermostat (RSTx), Room Thermostat (WRT) or Floor Heating Control (FSC8)
Wall Switches (ISS, ISS2)
Window-Door Sensor (WDS)
 */
export const HomeScreen = ()=>{
    const userStorage = useContentModel(state=>state.userStorage)
    const mapOfDeviceIds = useContentModel(state=>state.deviceIdMap)

    const res = useMemo(()=>{
        const category = userStorage.get(CATEGORY)
        if (!category){
            return []
        }
        const json = JSON.parse(category.value  as unknown as string)

        const userStorageWithValues:UserStorage[] = []
        Object.keys(json).forEach(key=> {
            // get actual home display
            const result = userStorage.get(key)
            if (result && typeof result.value === "string") {
                const showingDevicesId: UserStorageValueShow = JSON.parse(result.value)
                showingDevicesId.Show.map(c=> mapOfDeviceIds.get(c))
                    .filter(c=>{return c!==undefined &&TYPES.includes(c.type)})
                    .forEach(deviceId=>{
                        if (result.devices===undefined){
                            result.devices = []
                        }
                        result.devices.push(deviceId!)
                    })
                userStorageWithValues.push(result)
            }
        })
        return userStorageWithValues
    }, [])


    return <Accordion type="single" collapsible className="rounded-3xl">
        {res.map((userStorage: UserStorage)=><Category key={userStorage.key} userStorage={userStorage}/>)}
    </Accordion>

}
