import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadow, spacing } from "../theme/tokens";

export function BottomActionBar({ children }: { children: ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    ...shadow.floating,
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: 108,
    flexDirection: "row",
    gap: spacing.sm,
    left: spacing.lg,
    padding: spacing.sm,
    position: "absolute",
    right: spacing.lg,
  },
});
