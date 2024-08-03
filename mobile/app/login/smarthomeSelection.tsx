import {FlatList, View, Text} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useState} from "react";
import {getAllBaseURLs} from "@/utils/sqlite";

export default function SmartHomeSelection(){
    const [baseURLs, setBaseURLs] = useState<string[]>( () => {
         return getAllBaseURLs()
    })

    return <SafeAreaView>
            <View>
                <FlatList
                    data={baseURLs}
                    renderItem={({item})=>{
                        return <Text>{item}</Text>
                }}>
                </FlatList>
            </View>
    </SafeAreaView>
}



