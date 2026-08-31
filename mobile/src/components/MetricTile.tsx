import { StyleSheet, Text, View } from "react-native";
import { Minus, TrendingDown, TrendingUp } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, radius, shadow, typography } from "../theme/tokens";

export function MetricTile({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
  accentColor,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  accentColor?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? colors.success : trend === "down" ? colors.error : colors.muted;

  return (
    <View style={styles.metric}>
      <View style={styles.topRow}>
        {Icon ? <Icon size={14} color={colors.muted} /> : null}
        {trend ? <TrendIcon size={12} color={trendColor} /> : null}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.value, accentColor ? { color: accentColor } : undefined]}
      >
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metric: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadow.card,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
    minHeight: 16,
  },
  value: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: 0,
  },
  label: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: "uppercase",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
});
