import {Stack} from "expo-router";
import {useAppColors} from "@/hooks/useAppColors";

export default function RootLayout() {
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
                }
            }}
        >
            <Stack.Screen name="[deviceTypeList]" options={{title: "Geräte"}}/>
        </Stack>
    );
}
