import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export function FilterChip({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active?: boolean;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.active,
        pressed && styles.pressed,
      ]}
    >
      <Text numberOfLines={1} style={[styles.label, active && styles.activeLabel]}>
        {label}
        {typeof count === "number" ? ` ${count}` : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  active: {
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  activeLabel: {
    color: colors.lime,
  },
});
