import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadow, spacing } from "../theme/tokens";

export function Card({
  children,
  elevated = false,
  compact = false,
}: {
  children: ReactNode;
  elevated?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.card, elevated && styles.elevated, compact && styles.compact]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  elevated: {
    ...shadow.card,
  },
  compact: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
});
