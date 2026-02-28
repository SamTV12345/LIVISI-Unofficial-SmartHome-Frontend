import {Pressable, StyleSheet, Text, View} from "react-native";
import {Colors} from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";

type NavRowProps = {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
};

export const NavRow = ({title, subtitle, onPress, danger}: NavRowProps) => {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({pressed}) => [
                styles.row,
                pressed && onPress ? styles.pressed : null
            ]}
        >
            <View style={styles.textWrap}>
                <Text style={[styles.title, danger ? styles.titleDanger : null]}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {onPress ? <AntDesign name="right" size={14} color={Colors.app.textMuted}/> : null}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14
    },
    pressed: {
        opacity: 0.7
    },
    textWrap: {
        flexShrink: 1
    },
    title: {
        color: Colors.app.text,
        fontSize: 16,
        fontWeight: "600"
    },
    titleDanger: {
        color: "#b3384a"
    },
    subtitle: {
        color: Colors.app.textMuted,
        marginTop: 2
    }
});
