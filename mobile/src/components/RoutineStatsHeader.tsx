import { StyleSheet, Text, View } from "react-native";
import { BarChart3, Clock, Layers, Target } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, radius, shadow, withOpacity } from "../theme/tokens";

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Icon size={14} color={colors.muted} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function RoutineStatsHeader({
  exercises,
  sets,
  effectiveSets,
  minutes,
}: {
  exercises: number;
  sets: number;
  effectiveSets: number;
  minutes: number;
}) {
  return (
    <View style={styles.container}>
      <Stat icon={Layers} value={exercises} label="Ejercicios" />
      <View style={styles.divider} />
      <Stat icon={BarChart3} value={sets} label="Series" />
      <View style={styles.divider} />
      <Stat icon={Target} value={effectiveSets} label="Efectivas" />
      <View style={styles.divider} />
      <Stat icon={Clock} value={`${minutes}m`} label="Tiempo" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: withOpacity(colors.cyan, 0.05),
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: 12,
    ...shadow.card,
  },
  stat: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  divider: {
    backgroundColor: colors.border,
    width: 1,
  },
});
