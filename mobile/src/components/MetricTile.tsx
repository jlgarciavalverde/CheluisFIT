import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, typography } from "../theme/tokens";

export function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
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
    marginTop: 6,
    textTransform: "uppercase",
  },
});
