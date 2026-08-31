import { StyleSheet, Text, View } from "react-native";
import type { ExerciseRecordSummary } from "../api/types";
import { colors, radius } from "../theme/tokens";

export function PersonalRecordCard({
  exerciseName,
  record,
}: {
  exerciseName: string;
  record: ExerciseRecordSummary;
}) {
  return (
    <View style={styles.card}>
      <Text numberOfLines={1} style={styles.name}>
        {exerciseName}
      </Text>
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.label}>Peso max.</Text>
          <Text style={styles.value}>
            {record.bestWeight ? `${record.bestWeight.weightKg} kg` : "-"}
          </Text>
          <Text style={styles.meta}>
            {record.bestWeight ? `${record.bestWeight.reps} reps` : "Sin registro"}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.label}>Volumen max.</Text>
          <Text style={styles.value}>
            {record.bestVolume ? `${Math.round(record.bestVolume.volumeKg)} kg` : "-"}
          </Text>
          <Text style={styles.meta}>
            {record.lastEntry ? `${record.lastEntry.totalSets} series ultimo` : "Sin registro"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  value: {
    color: colors.lime,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    backgroundColor: colors.border,
    width: 1,
  },
});
