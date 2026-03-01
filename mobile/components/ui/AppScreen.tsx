import {PropsWithChildren, ReactNode, useMemo} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, StyleSheet, Text, View} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

type AppScreenProps = PropsWithChildren<{
    title?: string;
    subtitle?: string;
    rightAction?: ReactNode;
    scroll?: boolean;
    contentStyle?: object;
}>;

export const AppScreen = ({
    children,
    title,
    subtitle,
    rightAction,
    scroll = true,
    contentStyle
}: AppScreenProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    const content = (
        <View style={[styles.contentWrap, contentStyle]}>
            {(title || subtitle || rightAction) && (
                <View style={styles.headerRow}>
                    <View style={styles.headerTextWrap}>
                        {title ? <Text style={styles.title}>{title}</Text> : null}
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                    {rightAction}
                </View>
            )}
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.backgroundBlobTop}/>
            <View style={styles.backgroundBlobBottom}/>
            {scroll ? (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {content}
                </ScrollView>
            ) : (
                <View style={styles.nonScrollWrap}>
                    {content}
                </View>
            )}
        </SafeAreaView>
    );
};

const createStyles = (colors: AppPalette) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    backgroundBlobTop: {
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: 999,
        right: -130,
        top: -130,
        backgroundColor: colors.backgroundStrong,
        opacity: 0.8
    },
    backgroundBlobBottom: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 999,
        left: -120,
        bottom: -110,
        backgroundColor: colors.accentSoft,
        opacity: 0.55
    },
    scrollContent: {
        flexGrow: 1
    },
    nonScrollWrap: {
        flex: 1
    },
    contentWrap: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 10
    },
    headerRow: {
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    headerTextWrap: {
        flexShrink: 1
    },
    title: {
        color: colors.text,
        fontSize: 28,
        fontWeight: "800"
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: 4,
        lineHeight: 20
    }
});
