import {PropsWithChildren, useMemo} from "react";
import {StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

type SurfaceCardProps = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    muted?: boolean;
}>;

export const SurfaceCard = ({children, style, muted}: SurfaceCardProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

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

const createStyles = (colors: AppPalette) => StyleSheet.create({
    card: {
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        shadowColor: colors.shadow,
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 5},
        elevation: 3
    },
    cardMuted: {
        backgroundColor: colors.surfaceSoft
    }
});
