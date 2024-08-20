import {Device} from "@/models/Device";
import {FC, useMemo, useState} from "react";
import {CapabilityState} from "@/models/CapabilityState";
import {ACTION_ENDPOINT, CAPABILITY_PREFIX} from "@/constants/FieldConstants";
import {useDebounce} from "@/utils/useDebounce";
import {useContentModel} from "@/store/store";
import {StyleSheet, View, Text, Modal, TouchableOpacity} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {ThemedText} from "@/components/ThemedText";
import {Colors} from "@/constants/Colors";
import {ImageBackground} from "react-native";
import {RadialSlider} from "react-native-radial-slider";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


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

    const [modal, setModalOpen] = useState<boolean>(false)

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
                console.log("Changed temp")
                //mapOfStates.get(CAPABILITY_PREFIX + state.id).state.setpointTemperature.value = currentTemperature
                device.capabilityState!
                    .find(state => state.id === devMap.get(HEATING_TEMPERATURE)!.id)!.state.setpointTemperature.value = currentTemperature
            })
    }

    useDebounce(() => {
        updatePointTemperature()
    }, 2000, [currentTemperature])

    return <TouchableOpacity style={[OnOffDeviceLayout.box, OnOffDeviceLayout.boxSelected]} onPress={()=>{
        setModalOpen(true)
    }}>
        <Modal visible={modal} transparent>
        <ImageBackground
                style={{flex: 1}}
                resizeMode="cover"
                source={require('../assets/images/caucasus.jpg')}
                blurRadius={10}
            >
            <TouchableOpacity style={{flex: 1}} onPress={()=>{
                setModalOpen(false)
            }}>
                <View style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
                    <View  onStartShouldSetResponder={(event) => true}
                           onTouchEnd={(e) => {
                               e.stopPropagation();
                           }}>

                    <ThemedText style={{textAlign: 'center'}}>Zieltemperatur</ThemedText>
                    <RadialSlider value={currentTemperature} onChange={(v)=>{
                        setTemperature(v)
                    }} isHideTitle={true} unitStyle={{color: 'white'}} linearGradient={[ { offset: '0%', color:'blue' }, { offset: '100%', color: 'red' }]} unit={"°C"} min={0} max={30} isHideSubtitle={true} />
                    </View>
                </View>
                <FontAwesome name={"cog"} size={24} style={{position: 'absolute', right: 10, top: 10}}/>


            </TouchableOpacity>

            </ImageBackground>
        </Modal>
        <View style={{backgroundColor: 'orange', borderRadius: 2000, position: 'relative', width: 35, height: 35, marginLeft: 10, marginTop: 5}}>
            <ThemedText style={{position: 'absolute', left: '20%', top: '15%', fontSize: 10}}>{devMap.get(CURRENT_TEMPERATURE)?.state!.temperature.value}°</ThemedText>
        </View>
        <View style={{justifyContent: 'center', display: 'flex'}}>
            <Text style={[OnOffDeviceLayout.boxSelected, OnOffDeviceLayout.boxText]}>{device.config.name}</Text>
        </View>
        <View>
            <Text style={{fontSize: 10, textAlign: 'center' }}>Heizen auf {currentTemperature}°</Text>
        </View>
    </TouchableOpacity>
}

export const OnOffDeviceLayout = StyleSheet.create({
    box: {
        backgroundColor:'rgb(24 24 27)',
        position: 'relative',
        borderRadius: 20,
        width: 80,
        display: undefined,
        height: 80
    },
    contentWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxText: {
        fontWeight: 'bold',
        textAlign: 'center',
        flexWrap: 'wrap'
    },
    boxSelected: {
        color: 'black',
      backgroundColor: 'white'
    },
    boxNotSelected: {
      backgroundColor: '#80888c'
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