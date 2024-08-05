import {Device} from "@/models/Device";
import {FC, useMemo, useState} from "react";
import {CapabilityState} from "@/models/CapabilityState";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/constants/FieldConstants";
import {useDebounce} from "@/utils/useDebounce";
import {useContentModel} from "@/store/store";
import {StyleSheet, View} from "react-native";
import {FontAwesome,FontAwesome6} from "@expo/vector-icons";
import {ThemedView} from "@/components/ThemedView";
import {ThemedText} from "@/components/ThemedText";
import {Colors} from "@/constants/Colors";
import {OnOffDevice} from "@/components/OnOffDevice";

type HeatingdeviceProps = {
    device: Device
}
export const HEATING_TEMPERATURE = "setpointTemperature"
export const CURRENT_TEMPERATURE = "temperature"
export const HUMIDITY = "humidity"


export const Heatingdevice: FC<HeatingdeviceProps> = ({
    device
                                                      })=>{
    const baseURL = useContentModel(state=>state.baseURL)
    const devMap = useMemo(()=>{
        const devMap = new Map<string, CapabilityState>()
        for (const devState of device.capabilityState!) {
            if (devState.state.setpointTemperature) {
                devMap.set(HEATING_TEMPERATURE, devState)
            } else if (devState.state.temperature) {
                devMap.set(CURRENT_TEMPERATURE, devState)
            } else if (devState.state.humidity) {
                devMap.set(HUMIDITY, devState)
            }
        }
        return devMap
    }, [device])

    const [currentTemperature, setTemperature] = useState<number>(()=>{
        return devMap.get(HEATING_TEMPERATURE)!.state!.setpointTemperature.value as number
    })

    const constructHeatingModel = (newState: CapabilityState) => {
        return {
            target: CAPABILITY_PREFIX+newState.id,
            type: "SetState",
            namespace: "core."+device.manufacturer,
            params: {
                setpointTemperature: {
                    type: "Constant",
                    value: Number(currentTemperature)
                }
            }
        }
    }

    const updatePointTemperature = async () => {
        const heatingModel = constructHeatingModel(devMap.get(HEATING_TEMPERATURE)!)
        fetch(baseURL+ACTION_ENDPOINT, {
            body: JSON.stringify(heatingModel),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
            .then(() => {
                //mapOfStates.get(CAPABILITY_PREFIX + state.id).state.setpointTemperature.value = currentTemperature
                device.capabilityState!.find(state => state.id === devMap.get(HEATING_TEMPERATURE)!.id)!.state.setpointTemperature.value = currentTemperature
            })
    }

    useDebounce(() => {
        updatePointTemperature()
    }, 2000, [currentTemperature])

    return <ThemedView style={OnOffDeviceLayout.box}>
        <FontAwesome6 style={OnOffDeviceLayout.iconMiddle} name="temperature-empty" size={40} />
        <View>
        <ThemedText style={OnOffDeviceLayout.text}>{device.config.name}</ThemedText>
        <ThemedText  style={OnOffDeviceLayout.description}>{device.locationData?.config.name}</ThemedText>
            <View style={OnOffDeviceLayout.row}>
                <ThemedText style={OnOffDeviceLayout.text}>Zieltemperatur: </ThemedText>
                <ThemedText style={OnOffDeviceLayout.text}>{currentTemperature} °C</ThemedText>
            </View>
            <View style={OnOffDeviceLayout.row}>
                <ThemedText style={OnOffDeviceLayout.text}>Temperatur:</ThemedText>
                <ThemedText style={OnOffDeviceLayout.text}>{devMap.get(CURRENT_TEMPERATURE)?.state!.temperature.value}°C</ThemedText>
            </View>
            <View style={OnOffDeviceLayout.row}>
                <ThemedText style={OnOffDeviceLayout.text}>Luftfeuchtigkeit:</ThemedText>
                <ThemedText style={OnOffDeviceLayout.text}>{devMap.get(HUMIDITY)?.state!.humidity.value}%</ThemedText>
            </View>
            <ThemedText></ThemedText>
        </View>
    </ThemedView>
}

export const OnOffDeviceLayout = StyleSheet.create({
    box: {
        backgroundColor:'rgb(24 24 27)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 5,
        paddingTop: 5,
        gap: 20,
    },
    description: {
        fontSize: 12,
        color: 'gray'
    },
    row: {
        flex: 2,
        flexDirection: 'row'
    },
    iconMiddle: {
        top: '15%',
        color: 'white'
    },
    text: {
      color: 'white'
    },
    pusher: {
        flexGrow: 1
    },
    button: {
        justifyContent: 'center',
        alignContent: 'center',
        borderColor: Colors.color.white,
        borderWidth: 1,
        borderRadius: 200,
        padding: 5,
        width: 50,
        height: 50
    },
    buttonActive: {
        backgroundColor: Colors.color.green
    }
})