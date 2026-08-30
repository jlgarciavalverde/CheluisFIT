import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export function Surface({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "muted" | "accent";
}) {
  return <View style={[styles.surface, styles[tone]]}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  muted: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: `${colors.cyan}12`,
    borderColor: colors.borderStrong,
  },
});
