import {Pressable, StyleSheet, Text, View} from "react-native";
import {FC, useMemo} from "react";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

type ErrorBannerProps = {
    message: string,
    onRetry?: () => void
}

export const ErrorBanner: FC<ErrorBannerProps> = ({message, onRetry}) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <View style={styles.container}>
            <Text style={styles.message}>{message}</Text>
            {onRetry && <Pressable onPress={onRetry}>
                <Text style={styles.retry}>Erneut versuchen</Text>
            </Pressable>}
        </View>
    );
};

const createStyles = (colors: AppPalette) => StyleSheet.create({
    container: {
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: colors.warningSoft,
        borderColor: colors.warningBorder,
        borderWidth: 1
    },
    message: {
        color: colors.warningText,
        fontSize: 14
    },
    retry: {
        color: colors.warningText,
        textDecorationLine: "underline",
        marginTop: 8,
        fontWeight: "600"
    }
});
