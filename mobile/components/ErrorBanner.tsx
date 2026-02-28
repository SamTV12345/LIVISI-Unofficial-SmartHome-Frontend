import {Pressable, StyleSheet, Text, View} from "react-native";
import {FC} from "react";

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
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#5f1f1f",
        borderColor: "#ff6b6b",
        borderWidth: 1
    },
    message: {
        color: "#ffe0e0",
        fontSize: 14
    },
    retry: {
        color: "#ffd9d9",
        textDecorationLine: "underline",
        marginTop: 8,
        fontWeight: "600"
    }
});
