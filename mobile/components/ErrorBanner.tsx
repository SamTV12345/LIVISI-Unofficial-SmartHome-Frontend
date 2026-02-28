import {Pressable, StyleSheet, Text, View} from "react-native";
import {FC} from "react";
import {Colors} from "@/constants/Colors";

type ErrorBannerProps = {
    message: string,
    onRetry?: () => void
}

export const ErrorBanner: FC<ErrorBannerProps> = ({message, onRetry}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.message}>{message}</Text>
            {onRetry && <Pressable onPress={onRetry}>
                <Text style={styles.retry}>Erneut versuchen</Text>
            </Pressable>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.app.warningSoft,
        borderColor: Colors.app.warningBorder,
        borderWidth: 1
    },
    message: {
        color: Colors.app.warningText,
        fontSize: 14
    },
    retry: {
        color: Colors.app.warningText,
        textDecorationLine: "underline",
        marginTop: 8,
        fontWeight: "600"
    }
});
