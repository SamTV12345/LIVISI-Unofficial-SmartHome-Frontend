import {ReactNode, useMemo} from "react";
import {StyleSheet, Text, View} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    rightAction?: ReactNode;
};

export const SectionHeader = ({title, subtitle, rightAction}: SectionHeaderProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <View style={styles.row}>
            <View>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {rightAction}
        </View>
    );
};

const createStyles = (colors: AppPalette) => StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10
    },
    title: {
        color: colors.text,
        fontSize: 18,
        fontWeight: "700"
    },
    subtitle: {
        color: colors.textMuted,
        marginTop: 2
    }
});
