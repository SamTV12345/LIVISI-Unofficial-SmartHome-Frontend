import {StyleSheet, Text, TextInput, View} from "react-native";
import {Colors} from "@/constants/Colors";

type FormFieldProps = {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "url" | "email-address" | "number-pad";
    error?: string;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    error,
    autoCapitalize = "none"
}: FormFieldProps) => {
    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.app.textMuted}
                style={[styles.input, error ? styles.inputError : null]}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        marginBottom: 12
    },
    label: {
        color: Colors.app.text,
        fontWeight: "600",
        marginBottom: 6
    },
    input: {
        backgroundColor: Colors.app.surfaceSoft,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.app.border,
        color: Colors.app.text,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 16
    },
    inputError: {
        borderColor: "#d84d64"
    },
    errorText: {
        color: "#b3384a",
        marginTop: 6
    }
});
