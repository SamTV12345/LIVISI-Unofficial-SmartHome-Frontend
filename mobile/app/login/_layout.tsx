import {Stack} from "expo-router";
import {useAppColors} from "@/hooks/useAppColors";

export default function Login() {
    const appColors = useAppColors();

    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: appColors.surface
                },
                headerTintColor: appColors.text,
                headerTitleStyle: {
                    fontWeight: "700"
                },
                contentStyle: {
                    backgroundColor: appColors.background
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
