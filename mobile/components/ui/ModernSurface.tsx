import {PropsWithChildren, ReactNode, useMemo} from "react";
import {StyleProp, StyleSheet, Text, View, ViewStyle} from "react-native";
import {AppPalette} from "@/constants/Colors";
import {useAppColors} from "@/hooks/useAppColors";

export type HeroBadge = {
    label: string;
    icon?: ReactNode;
};

export type HeroStat = {
    label: string;
    value: ReactNode;
};

type ModernHeroProps = {
    title: string;
    subtitle?: string;
    badges?: HeroBadge[];
    stats?: HeroStat[];
    actionSlot?: ReactNode;
    style?: StyleProp<ViewStyle>;
};

type ModernSectionProps = PropsWithChildren<{
    title: string;
    description?: string;
    icon?: ReactNode;
    actionSlot?: ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
}>;

export const ModernHero = ({
    title,
    subtitle,
    badges = [],
    stats = [],
    actionSlot,
    style
}: ModernHeroProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <View style={[styles.hero, style]}>
            <View style={styles.heroTintLeft}/>
            <View style={styles.heroTintRight}/>
            <View style={styles.heroGlowTop}/>
            <View style={styles.heroGlowBottom}/>
            <View style={styles.heroOverlay}/>

            <View style={styles.heroContent}>
                <View style={{flex: 1}}>
                    <Text style={styles.heroTitle}>{title}</Text>
                    {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
                    {badges.length > 0 && (
                        <View style={styles.badgeWrap}>
                            {badges.map((badge) => (
                                <View key={badge.label} style={styles.badge}>
                                    {badge.icon}
                                    <Text style={styles.badgeLabel}>{badge.label}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                {actionSlot ? <View style={{marginLeft: 12}}>{actionSlot}</View> : null}
            </View>

            {stats.length > 0 && (
                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.label} style={styles.statCard}>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

export const ModernSection = ({
    title,
    description,
    icon,
    actionSlot,
    style,
    contentStyle,
    children
}: ModernSectionProps) => {
    const appColors = useAppColors();
    const styles = useMemo(() => createStyles(appColors), [appColors]);

    return (
        <View style={[styles.section, style]}>
            <View style={styles.sectionHeader}>
                {icon}
                <View style={styles.sectionTextWrap}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
                </View>
                {actionSlot}
            </View>
            <View style={[styles.sectionContent, contentStyle]}>
                {children}
            </View>
        </View>
    );
};

const createStyles = (colors: AppPalette) => StyleSheet.create({
    hero: {
        overflow: "hidden",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: 16,
        backgroundColor: colors.heroFrom,
        marginBottom: 14,
        shadowColor: colors.shadow,
        shadowOpacity: 0.34,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 8},
        elevation: 8
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.heroOverlay
    },
    heroTintLeft: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 280,
        left: -120,
        top: -130,
        backgroundColor: colors.heroVia,
        opacity: 0.46
    },
    heroTintRight: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 300,
        right: -130,
        bottom: -170,
        backgroundColor: colors.heroTo,
        opacity: 0.44
    },
    heroGlowTop: {
        position: "absolute",
        width: 250,
        height: 250,
        borderRadius: 220,
        right: -100,
        top: -90,
        backgroundColor: colors.heroGlowTop
    },
    heroGlowBottom: {
        position: "absolute",
        width: 250,
        height: 250,
        borderRadius: 220,
        left: -120,
        bottom: -130,
        backgroundColor: colors.heroGlowBottom
    },
    heroContent: {
        zIndex: 1,
        flexDirection: "row",
        alignItems: "flex-start"
    },
    heroTitle: {
        color: "white",
        fontSize: 27,
        fontWeight: "800"
    },
    heroSubtitle: {
        color: "rgba(255,255,255,0.92)",
        marginTop: 4,
        lineHeight: 20
    },
    badgeWrap: {
        marginTop: 12,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    badge: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.24)",
        backgroundColor: "rgba(0,0,0,0.14)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    badgeLabel: {
        color: "white",
        fontSize: 12,
        fontWeight: "600"
    },
    statsGrid: {
        zIndex: 1,
        marginTop: 12,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    statCard: {
        minWidth: "47%",
        flexGrow: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.16)",
        backgroundColor: "rgba(4, 19, 30, 0.2)",
        paddingHorizontal: 10,
        paddingVertical: 9
    },
    statLabel: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.6
    },
    statValue: {
        color: "white",
        marginTop: 3,
        fontWeight: "700",
        fontSize: 14
    },
    section: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceRaised,
        overflow: "hidden",
        shadowColor: colors.shadow,
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
        elevation: 3
    },
    sectionHeader: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 11,
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    sectionTextWrap: {
        flex: 1
    },
    sectionTitle: {
        color: colors.text,
        fontWeight: "700",
        fontSize: 16
    },
    sectionDescription: {
        color: colors.textMuted,
        marginTop: 2,
        fontSize: 13
    },
    sectionContent: {
        padding: 12
    }
});
