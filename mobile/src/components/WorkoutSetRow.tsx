import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function WorkoutSetRow({
  index,
  weightKg,
  reps,
}: {
  index: number;
  weightKg: number;
  reps: number;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.index}>S{index + 1}</Text>
      <Text style={styles.value}>{weightKg} kg</Text>
      <Text style={styles.value}>{reps} reps</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 12,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  index: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
    width: 28,
  },
  value: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
});
