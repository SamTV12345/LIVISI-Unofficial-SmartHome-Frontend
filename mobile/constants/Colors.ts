/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  color: {
    green:'#2fa36b',
    white: '#fff',
    black: '#000',
    beige: '#e5eadc'
  },
  app: {
    background: "#edf4fa",
    backgroundStrong: "#e3eef8",
    surface: "#ffffff",
    surfaceSoft: "#f5f9fd",
    border: "#d3e2ef",
    text: "#102a43",
    textMuted: "#5f7388",
    primary: "#1273cf",
    primarySoft: "#e6f1ff",
    success: "#2fa36b",
    successSoft: "#def4e8",
    warningSoft: "#fff1dd",
    warningBorder: "#ffd8a4",
    warningText: "#8a5600",
    shadow: "rgba(16, 42, 67, 0.12)"
  },
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  accent: 'rgb(39, 39, 42)',
  background: '#edf4fa',
  borderColor: '#d3e2ef',
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
