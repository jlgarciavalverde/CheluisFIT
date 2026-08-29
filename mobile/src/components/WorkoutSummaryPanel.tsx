import { StyleSheet, Text, View } from "react-native";
import type { MuscleSummaryPoint } from "../api/types";
import { EmptyState } from "./EmptyState";
import { MuscleVolumeMeter } from "./MuscleVolumeMeter";
import { colors, radius } from "../theme/tokens";

export function WorkoutSummaryPanel({ summary }: { summary: MuscleSummaryPoint[] }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Resumen del entreno</Text>
      <Text style={styles.copy}>Series efectivas por musculo · objetivo sesion F2</Text>
      {summary.length === 0 ? (
        <EmptyState title="Sin series efectivas" message="Las series de calentamiento no cuentan." />
      ) : (
        summary.map((point) => <MuscleVolumeMeter key={point.muscle} point={point} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    fontSize: 12,
  },
});
