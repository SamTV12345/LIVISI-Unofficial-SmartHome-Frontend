import {PropsWithChildren, ReactNode} from "react";
import {StyleProp, StyleSheet, Text, View, ViewStyle} from "react-native";
import {Colors} from "@/constants/Colors";

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
    return (
        <View style={[styles.hero, style]}>
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

const styles = StyleSheet.create({
    hero: {
        overflow: "hidden",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(14, 46, 79, 0.22)",
        padding: 16,
        backgroundColor: "#1f5f97",
        marginBottom: 14
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(16, 103, 94, 0.28)"
    },
    heroGlowTop: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 220,
        right: -90,
        top: -90,
        backgroundColor: "rgba(255,255,255,0.2)"
    },
    heroGlowBottom: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 220,
        left: -110,
        bottom: -120,
        backgroundColor: "rgba(164, 219, 142, 0.2)"
    },
    heroContent: {
        zIndex: 1,
        flexDirection: "row",
        alignItems: "flex-start"
    },
    heroTitle: {
        color: "white",
        fontSize: 26,
        fontWeight: "700"
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
        borderColor: "rgba(255,255,255,0.25)",
        backgroundColor: "rgba(0,0,0,0.12)",
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
        backgroundColor: "rgba(0,0,0,0.14)",
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
        borderColor: Colors.app.border,
        backgroundColor: Colors.app.surface,
        overflow: "hidden"
    },
    sectionHeader: {
        borderBottomWidth: 1,
        borderBottomColor: "#e8eff6",
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
        color: Colors.app.text,
        fontWeight: "700",
        fontSize: 16
    },
    sectionDescription: {
        color: Colors.app.textMuted,
        marginTop: 2,
        fontSize: 13
    },
    sectionContent: {
        padding: 12
    }
});
