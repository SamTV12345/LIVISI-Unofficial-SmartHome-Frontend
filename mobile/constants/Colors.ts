import {Appearance, ColorSchemeName} from "react-native";

export type AppPalette = {
    background: string;
    backgroundStrong: string;
    surface: string;
    surfaceSoft: string;
    surfaceRaised: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textSoft: string;
    primary: string;
    primaryStrong: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
    success: string;
    successSoft: string;
    warningSoft: string;
    warningBorder: string;
    warningText: string;
    danger: string;
    dangerSoft: string;
    shadow: string;
    heroFrom: string;
    heroVia: string;
    heroTo: string;
    heroOverlay: string;
    heroGlowTop: string;
    heroGlowBottom: string;
};

const appLight: AppPalette = {
    background: "#e8f4fa",
    backgroundStrong: "#d9ede7",
    surface: "#ffffff",
    surfaceSoft: "#f2f8fc",
    surfaceRaised: "#fdfefe",
    border: "#ccdeec",
    borderStrong: "#b9d2e3",
    text: "#102437",
    textMuted: "#5e748a",
    textSoft: "#8196aa",
    primary: "#1b78b3",
    primaryStrong: "#12518b",
    primarySoft: "#e3f2fb",
    accent: "#2f8a6b",
    accentSoft: "#e2f5ed",
    success: "#2e9a67",
    successSoft: "#dff4e9",
    warningSoft: "#fff1dc",
    warningBorder: "#ffd39d",
    warningText: "#8d5510",
    danger: "#cc4c65",
    dangerSoft: "#ffe8ee",
    shadow: "rgba(16, 42, 67, 0.14)",
    heroFrom: "#12518b",
    heroVia: "#1d6c88",
    heroTo: "#2f8a6b",
    heroOverlay: "rgba(6, 29, 47, 0.14)",
    heroGlowTop: "rgba(255, 255, 255, 0.2)",
    heroGlowBottom: "rgba(185, 238, 207, 0.18)"
};

const appDark: AppPalette = {
    background: "#0b1422",
    backgroundStrong: "#10263a",
    surface: "#11253a",
    surfaceSoft: "#16304a",
    surfaceRaised: "#173550",
    border: "#2a4b66",
    borderStrong: "#355c7a",
    text: "#dfebf7",
    textMuted: "#9cb1c6",
    textSoft: "#7f95aa",
    primary: "#63c1ef",
    primaryStrong: "#2a8fbe",
    primarySoft: "#13314a",
    accent: "#63caa7",
    accentSoft: "#193c36",
    success: "#64d6a2",
    successSoft: "#173d35",
    warningSoft: "#4a3a20",
    warningBorder: "#7a5f2f",
    warningText: "#f3d18a",
    danger: "#ef7992",
    dangerSoft: "#4a2430",
    shadow: "rgba(4, 12, 21, 0.5)",
    heroFrom: "#143257",
    heroVia: "#1b4b67",
    heroTo: "#1a6450",
    heroOverlay: "rgba(3, 12, 22, 0.34)",
    heroGlowTop: "rgba(153, 219, 255, 0.12)",
    heroGlowBottom: "rgba(130, 229, 181, 0.1)"
};

export const resolveAppPalette = (scheme?: ColorSchemeName): AppPalette => (
    scheme === "dark" ? appDark : appLight
);

const initialPalette = resolveAppPalette(Appearance.getColorScheme());

export const Colors = {
    color: {
        green: "#2fa36b",
        white: "#fff",
        black: "#000",
        beige: "#e5eadc"
    },
    app: initialPalette,
    appLight,
    appDark,
    light: {
        text: appLight.text,
        background: appLight.background,
        tint: appLight.primary,
        icon: appLight.textMuted,
        tabIconDefault: appLight.textMuted,
        tabIconSelected: appLight.primary
    },
    dark: {
        text: appDark.text,
        background: appDark.background,
        tint: appDark.primary,
        icon: appDark.textMuted,
        tabIconDefault: appDark.textMuted,
        tabIconSelected: appDark.primary
    },
    accent: "rgb(39, 39, 42)",
    background: initialPalette.background,
    borderColor: initialPalette.border
};
