import {Animated, FlatList, Pressable, StyleSheet, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useState} from "react";
import {AppconfigData, deleteBaseURL, getAllBaseURLs, setActive} from "@/utils/sqlite";
import {ThemedText} from "@/components/ThemedText";
import AntDesign from '@expo/vector-icons/AntDesign';
import {GestureHandlerRootView, Swipeable} from "react-native-gesture-handler";
import AnimatedInterpolation = Animated.AnimatedInterpolation;

export default function SmartHomeSelection() {
    const [baseURLs, setBaseURLs] = useState<AppconfigData[]>(() => {
        return getAllBaseURLs()
    })

    const renderRightActions = ((progressAnimatedValue: AnimatedInterpolation<string | number>, dragAnimatedValue: AnimatedInterpolation<string | number>, swipeable: any) => {
        const scale = dragAnimatedValue.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <Pressable onPress={() => {
                deleteBaseURL(swipeable)
                setBaseURLs(getAllBaseURLs())
            }} style={styles.deleteButton}>
                <Animated.Text style={[styles.deleteButtonText, { transform: [{ scale }] }]}>
                    Löschen
                </Animated.Text>
            </Pressable>
        );
    });

    const Separator = () => <View style={{backgroundColor: '#C7C7CC', height: 0.2, marginLeft: '15%', }}/>;

    return <GestureHandlerRootView style={{flex: 1}}><SafeAreaView>
        <View>
            <FlatList
                contentContainerStyle={{
                    justifyContent: 'center',
                    marginLeft: 30,
                    marginRight: 30,
                    alignItems: 'center',
                    marginTop: 20,
                    backgroundColor: '#1C1C1E',
                    borderRadius: 8, overflow: 'hidden'
            }}
                data={baseURLs}
                ItemSeparatorComponent={Separator}
                renderItem={({item}) => {
                    return                             <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}>
                        <View key={item.id} style={{
                        display: 'flex', width: '100%',
                            flexDirection: 'row',
                            backgroundColor: '#1C1C1E',
                            borderRadius:200,
                        padding: 12,
                    }}>
                        <Pressable onPress={()=>{
                            setActive(item.id)
                            setBaseURLs(getAllBaseURLs())
                        }} style={{width: '100%', flexDirection: 'row'}}>
                            <ThemedText style={{width: '10%'}}>{item.active == 1 &&
                                <AntDesign name="check" size={24} color="#0385FF"/>}</ThemedText>
                            <ThemedText style={{width: '90%'}}>
                                {item.id}
                            </ThemedText>
                        </Pressable>
                        </View></Swipeable>
                }}>
            </FlatList>
        </View>
    </SafeAreaView>
    </GestureHandlerRootView>
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    listContent: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: '#1C1C1E',
        borderRadius: 15,
        overflow: 'hidden',
        padding: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        padding: 8,
        width: '100%',
    },
    pressable: {
        width: '100%',
        flexDirection: 'row',
    },
    checkIcon: {
        width: '20%',
    },
    itemText: {
        width: '80%',
        color: '#FFFFFF',
    },
    separator: {
        height: 1,
        width: '50%',
        backgroundColor: '#333333',
        alignSelf: 'center',
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});