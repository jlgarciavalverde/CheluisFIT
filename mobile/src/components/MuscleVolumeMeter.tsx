import { StyleSheet, Text, View } from "react-native";
import type { MuscleSummaryPoint } from "../api/types";
import { colors, radius } from "../theme/tokens";

export function MuscleVolumeMeter({ point }: { point: MuscleSummaryPoint }) {
  const progress = Math.min(point.effectiveSets / point.recommendedMax, 1);
  const statusColor =
    point.effectiveSets < point.recommendedMin
      ? colors.cyan
      : point.effectiveSets <= point.recommendedMax
        ? colors.lime
        : colors.error;

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.muscle}>{point.muscle}</Text>
        <Text style={[styles.value, { color: statusColor }]}>
          {formatSets(point.effectiveSets)} / {point.recommendedMin}-{point.recommendedMax}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: statusColor, flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

function formatSets(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  top: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  muscle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  value: {
    fontSize: 12,
    fontWeight: "900",
  },
  track: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    flexDirection: "row",
    height: 8,
    overflow: "hidden",
  },
  fill: {
    borderRadius: radius.sm,
  },
});
