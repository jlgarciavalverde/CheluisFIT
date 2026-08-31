import { StyleSheet, Text, View } from "react-native";
import { colors, radius, withOpacity } from "../theme/tokens";

export function WorkoutProgressBar({ completed, total }: { completed: number; total: number }) {
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.text}>Progreso del entreno</Text>
        <Text style={styles.value}>
          {completed}/{total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: withOpacity(colors.lime, 0.05),
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  track: {
    backgroundColor: colors.surface3,
    borderRadius: 999,
    height: 7,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    height: 7,
  },
});
