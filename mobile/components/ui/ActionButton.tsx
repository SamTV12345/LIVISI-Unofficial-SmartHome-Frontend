import {useMemo} from "react";
import {Pressable, StyleSheet, Text} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

type ActionButtonProps = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: "primary" | "ghost";
};

export const ActionButton = ({title, onPress, disabled, variant = "primary"}: ActionButtonProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <Pressable
            style={({pressed}) => [
                styles.base,
                variant === "primary" ? styles.primary : styles.ghost,
                pressed && !disabled ? styles.pressed : null,
                disabled ? styles.disabled : null
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={[styles.label, variant === "ghost" ? styles.ghostLabel : styles.primaryLabel]}>
                {title}
            </Text>
        </Pressable>
    );
};

const createStyles = (colors: AppPalette) => StyleSheet.create({
    base: {
        borderRadius: 14,
        paddingVertical: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    primary: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryStrong
    },
    ghost: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.border
    },
    pressed: {
        opacity: 0.88,
        transform: [{translateY: 1}]
    },
    disabled: {
        opacity: 0.55
    },
    label: {
        fontWeight: "700",
        fontSize: 15
    },
    primaryLabel: {
        color: "white"
    },
    ghostLabel: {
        color: colors.primary
    }
});
