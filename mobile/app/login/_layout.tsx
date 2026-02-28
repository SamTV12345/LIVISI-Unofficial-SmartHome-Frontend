import {Stack} from "expo-router";
import {Colors} from "@/constants/Colors";

export default function Login() {
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: Colors.app.background
                },
                headerTintColor: Colors.app.text,
                headerTitleStyle: {
                    fontWeight: "700"
                },
                contentStyle: {
                    backgroundColor: Colors.app.background
                }
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Gateway verbinden"
                }}
            />
            <Stack.Screen
                name="smarthomeSelection"
                options={{
                    title: "Gespeicherte Gateways"
                }}
            />
            <Stack.Screen
                name="SmarthomeDetailAdd"
                options={{
                    title: "Gateway hinzufügen"
                }}
            />
        </Stack>
    );
}
