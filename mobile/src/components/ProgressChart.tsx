import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function ProgressChart({ values }: { values: number[] }) {
  const max = useMemo(() => Math.max(...values, 1), [values]);

  if (values.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>Sin datos todavia.</Text>
      </View>
    );
  }

  return (
    <View style={styles.chart}>
      {values.slice(-8).map((value, index) => (
        <View key={`${value}-${index}`} style={styles.barWrap}>
          <View style={[styles.bar, { height: Math.max(14, (value / max) * 120) }]} />
          <Text style={styles.barLabel}>{Math.round(value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 150,
    padding: 12,
  },
  barWrap: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    justifyContent: "flex-end",
  },
  bar: {
    backgroundColor: colors.cyan,
    borderRadius: 5,
    width: "100%",
  },
  barLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  emptyChart: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
});
