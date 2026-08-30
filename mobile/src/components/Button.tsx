import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, opacity, radius, shadow, spacing } from "../theme/tokens";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  size?: "md" | "sm";
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  label,
  onPress,
  disabled,
  icon: Icon,
  size = "md",
  variant = "primary",
}: ButtonProps) {
  const labelColor = variant === "primary" ? colors.primaryOn : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {Icon ? <Icon color={labelColor} size={size === "sm" ? 15 : 17} strokeWidth={2.8} /> : null}
      <Text style={[styles.label, { color: labelColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  md: {
    minHeight: 46,
    paddingHorizontal: 16,
  },
  sm: {
    minHeight: 34,
    paddingHorizontal: 12,
  },
  primary: {
    backgroundColor: colors.lime,
    ...shadow.card,
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
});
