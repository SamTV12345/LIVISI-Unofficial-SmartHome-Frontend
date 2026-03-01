import {useMemo} from "react";
import {useColorScheme} from "react-native";
import {DarkTheme, DefaultTheme, Theme} from "@react-navigation/native";
import {resolveAppPalette} from "@/constants/Colors";

export const useAppColors = () => {
    const colorScheme = useColorScheme();
    return useMemo(() => resolveAppPalette(colorScheme), [colorScheme]);
};

export const useNavigationTheme = (): Theme => {
    const colorScheme = useColorScheme();
    const colors = useAppColors();

    return useMemo(() => {
        const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
        return {
            ...baseTheme,
            dark: colorScheme === "dark",
            colors: {
                ...baseTheme.colors,
                primary: colors.primary,
                background: colors.background,
                card: colors.surface,
                text: colors.text,
                border: colors.border,
                notification: colors.accent
            }
        };
    }, [colorScheme, colors]);
};
