import {Pressable, StyleSheet, Text} from "react-native";
import {Colors} from "@/constants/Colors";

type ActionButtonProps = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: "primary" | "ghost";
};

export const ActionButton = ({title, onPress, disabled, variant = "primary"}: ActionButtonProps) => {
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

const styles = StyleSheet.create({
    base: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center"
    },
    primary: {
        backgroundColor: Colors.app.primary
    },
    ghost: {
        backgroundColor: Colors.app.primarySoft
    },
    pressed: {
        opacity: 0.85
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
        color: Colors.app.primary
    }
});
