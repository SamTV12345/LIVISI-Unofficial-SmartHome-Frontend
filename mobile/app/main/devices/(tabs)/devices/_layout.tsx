import {Stack} from "expo-router";
import {Colors} from "@/constants/Colors";

export default function RootLayout() {
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
                }
            }}
        >
            <Stack.Screen name="[deviceTypeList]" options={{title: "Geräte"}}/>
        </Stack>
    );
}
