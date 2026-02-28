import {StyleSheet, Text, View} from "react-native";
import {Colors} from "@/constants/Colors";

type StatusPillProps = {
    label: string;
    tone?: "neutral" | "primary" | "success" | "warning";
};

export const StatusPill = ({label, tone = "neutral"}: StatusPillProps) => {
    return (
        <View style={[styles.pill, toneStyles[tone].background]}>
            <Text style={[styles.label, toneStyles[tone].text]}>{label}</Text>
        </View>
    );
};

const toneStyles = {
    neutral: StyleSheet.create({
        background: {backgroundColor: Colors.app.surfaceSoft},
        text: {color: Colors.app.textMuted}
    }),
    primary: StyleSheet.create({
        background: {backgroundColor: Colors.app.primarySoft},
        text: {color: Colors.app.primary}
    }),
    success: StyleSheet.create({
        background: {backgroundColor: Colors.app.successSoft},
        text: {color: Colors.app.success}
    }),
    warning: StyleSheet.create({
        background: {backgroundColor: Colors.app.warningSoft},
        text: {color: Colors.app.warningText}
    })
};

const styles = StyleSheet.create({
    pill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start"
    },
    label: {
        fontSize: 12,
        fontWeight: "700"
    }
});
