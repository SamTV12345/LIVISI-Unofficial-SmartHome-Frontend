import {PropsWithChildren, useEffect, useRef} from "react";
import {Animated, Easing, StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {Colors} from "@/constants/Colors";

type SkeletonBlockProps = {
    height: number;
    width?: number | `${number}%`;
    radius?: number;
    style?: StyleProp<ViewStyle>;
};

export const SkeletonBlock = ({height, width = "100%", radius = 12, style}: SkeletonBlockProps) => {
    const opacity = useRef(new Animated.Value(0.42)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.9,
                    duration: 720,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0.42,
                    duration: 720,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                })
            ])
        );
        animation.start();
        return () => {
            animation.stop();
        };
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeletonBlock,
                {
                    height,
                    width,
                    borderRadius: radius,
                    opacity
                },
                style
            ]}
        />
    );
};

export const SkeletonCard = ({children, style}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) => {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

export const MainLoadingSkeleton = () => {
    return (
        <View style={styles.container}>
            <SkeletonCard style={{marginBottom: 14}}>
                <SkeletonBlock height={30} width="48%"/>
                <SkeletonBlock height={18} width="76%" style={{marginTop: 10}}/>
                <SkeletonBlock height={14} width="36%" style={{marginTop: 16}}/>
                <View style={{flexDirection: "row", gap: 8, marginTop: 10}}>
                    <SkeletonBlock height={30} width="31%" radius={999}/>
                    <SkeletonBlock height={30} width="31%" radius={999}/>
                    <SkeletonBlock height={30} width="31%" radius={999}/>
                </View>
                <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16}}>
                    <SkeletonBlock height={62} width="48%"/>
                    <SkeletonBlock height={62} width="48%"/>
                    <SkeletonBlock height={62} width="48%"/>
                    <SkeletonBlock height={62} width="48%"/>
                </View>
            </SkeletonCard>

            <SkeletonCard style={{marginBottom: 14}}>
                <SkeletonBlock height={22} width="38%"/>
                <SkeletonBlock height={16} width="58%" style={{marginTop: 8, marginBottom: 12}}/>
                <SkeletonBlock height={68} style={{marginBottom: 10}}/>
                <SkeletonBlock height={68} style={{marginBottom: 10}}/>
                <SkeletonBlock height={68}/>
            </SkeletonCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.app.background,
        paddingHorizontal: 18,
        paddingTop: 16
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.app.border,
        backgroundColor: Colors.app.surface,
        padding: 14
    },
    skeletonBlock: {
        backgroundColor: "#d8e7f4"
    }
});
