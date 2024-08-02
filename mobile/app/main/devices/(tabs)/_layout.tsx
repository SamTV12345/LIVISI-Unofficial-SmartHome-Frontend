import {Tabs} from "expo-router";
import {FontAwesome} from "@expo/vector-icons";
import {Colors} from "@/constants/Colors";

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: 'white', tabBarInactiveBackgroundColor: Colors.background,
            tabBarActiveBackgroundColor: Colors.background, tabBarStyle: {
            borderTopColor: Colors.borderColor,
                 borderTopWidth: 2
            },
                }}>
            <Tabs.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: 'Geräte',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="mobile-phone" color={color} />,
                }}
            />
            <Tabs.Screen
                name="test"
                options={{
                    headerShown: false,
                    title: 'GeräteTyp',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
                }}
            />
        </Tabs>
    );
}