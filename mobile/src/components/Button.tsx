import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme/tokens";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size?: "md" | "sm";
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ label, onPress, disabled, size = "md", variant = "primary" }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant === "primary" ? styles.primaryLabel : styles.altLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
  },
  md: {
    minHeight: 46,
    paddingHorizontal: 16,
  },
  sm: {
    minHeight: 32,
    paddingHorizontal: 12,
  },
  primary: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderColor: colors.cyan,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
  },
  primaryLabel: {
    color: colors.background,
  },
  altLabel: {
    color: colors.text,
  },
});
