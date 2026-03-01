import {useMemo} from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {AppPalette} from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import {useAppColors} from "@/hooks/useAppColors";

type NavRowProps = {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
};

export const NavRow = ({title, subtitle, onPress, danger}: NavRowProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({pressed}) => [
                styles.row,
                pressed && onPress ? styles.pressed : null
            ]}
        >
            <View style={styles.textWrap}>
                <Text style={[styles.title, danger ? styles.titleDanger : null]}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {onPress ? <AntDesign name="right" size={14} color={appColors.textMuted}/> : null}
        </Pressable>
    );
};

const createStyles = (colors: AppPalette) => StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderRadius: 12
    },
    pressed: {
        backgroundColor: colors.surfaceSoft
    },
    textWrap: {
        flexShrink: 1
    },
    title: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "600"
    },
    titleDanger: {
        color: colors.danger
    },
    subtitle: {
        color: colors.textMuted,
        marginTop: 2
    }
});
