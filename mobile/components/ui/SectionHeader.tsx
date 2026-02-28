import {ReactNode} from "react";
import {StyleSheet, Text, View} from "react-native";
import {Colors} from "@/constants/Colors";

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    rightAction?: ReactNode;
};

export const SectionHeader = ({title, subtitle, rightAction}: SectionHeaderProps) => {
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

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10
    },
    title: {
        color: Colors.app.text,
        fontSize: 18,
        fontWeight: "700"
    },
    subtitle: {
        color: Colors.app.textMuted,
        marginTop: 2
    }
});
