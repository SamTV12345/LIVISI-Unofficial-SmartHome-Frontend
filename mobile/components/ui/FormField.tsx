import {useMemo} from "react";
import {StyleSheet, Text, TextInput, View} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

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
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={appColors.textSoft}
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

const createStyles = (colors: AppPalette) => StyleSheet.create({
    wrap: {
        marginBottom: 12
    },
    label: {
        color: colors.text,
        fontWeight: "700",
        marginBottom: 6,
        fontSize: 13,
        letterSpacing: 0.2
    },
    input: {
        backgroundColor: colors.surfaceSoft,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        color: colors.text,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 16
    },
    inputError: {
        borderColor: colors.danger
    },
    errorText: {
        color: colors.danger,
        marginTop: 6
    }
});
