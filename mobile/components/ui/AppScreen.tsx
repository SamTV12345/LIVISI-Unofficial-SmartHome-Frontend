import {PropsWithChildren, ReactNode} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, StyleSheet, Text, View} from "react-native";
import {Colors} from "@/constants/Colors";

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
        <SafeAreaView style={styles.safeArea}>
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
                content
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.app.background
    },
    backgroundBlobTop: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 999,
        right: -120,
        top: -120,
        backgroundColor: Colors.app.backgroundStrong
    },
    backgroundBlobBottom: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 999,
        left: -100,
        bottom: -90,
        backgroundColor: Colors.app.backgroundStrong
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 28
    },
    contentWrap: {
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
        color: Colors.app.text,
        fontSize: 26,
        fontWeight: "700"
    },
    subtitle: {
        color: Colors.app.textMuted,
        fontSize: 14,
        marginTop: 4
    }
});
