import {useMemo} from "react";
import {StyleSheet, Text, View} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

type StatusPillProps = {
    label: string;
    tone?: "neutral" | "primary" | "success" | "warning";
};

export const StatusPill = ({label, tone = "neutral"}: StatusPillProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);
    const toneStyles = useMemo(() => createToneStyles(appColors), [appColors]);

    return (
        <View style={[styles.pill, toneStyles[tone].background]}>
            <Text style={[styles.label, toneStyles[tone].text]}>{label}</Text>
        </View>
    );
};

const createToneStyles = (colors: AppPalette) => ({
    neutral: StyleSheet.create({
        background: {
            backgroundColor: colors.surfaceSoft,
            borderColor: colors.border,
            borderWidth: 1
        },
        text: {color: colors.textMuted}
    }),
    primary: StyleSheet.create({
        background: {
            backgroundColor: colors.primarySoft,
            borderColor: colors.borderStrong,
            borderWidth: 1
        },
        text: {color: colors.primary}
    }),
    success: StyleSheet.create({
        background: {
            backgroundColor: colors.successSoft,
            borderColor: colors.accent,
            borderWidth: 1
        },
        text: {color: colors.success}
    }),
    warning: StyleSheet.create({
        background: {
            backgroundColor: colors.warningSoft,
            borderColor: colors.warningBorder,
            borderWidth: 1
        },
        text: {color: colors.warningText}
    })
});

const createStyles = (_colors: AppPalette) => StyleSheet.create({
    pill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start"
    },
    label: {
        fontSize: 12,
        fontWeight: "700"
    }
});
