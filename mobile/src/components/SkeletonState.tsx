import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export function SkeletonState({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.thumb} />
          <View style={styles.copy}>
            <View style={styles.lineWide} />
            <View style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 74,
    padding: spacing.md,
  },
  thumb: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    height: 42,
    width: 42,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  lineWide: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    height: 12,
    width: "72%",
  },
  lineShort: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    height: 10,
    width: "42%",
  },
});
