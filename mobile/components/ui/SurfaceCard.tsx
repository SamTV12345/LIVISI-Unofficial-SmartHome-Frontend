import {PropsWithChildren} from "react";
import {StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {Colors} from "@/constants/Colors";

type SurfaceCardProps = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    muted?: boolean;
}>;

export const SurfaceCard = ({children, style, muted}: SurfaceCardProps) => {
    return (
        <View style={[
            styles.card,
            muted && styles.cardMuted,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.app.surface,
        borderColor: Colors.app.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        shadowColor: "#132a40",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 4},
        elevation: 2
    },
    cardMuted: {
        backgroundColor: Colors.app.surfaceSoft
    }
});
