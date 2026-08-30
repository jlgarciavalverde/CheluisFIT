import { StyleSheet, Text, View } from "react-native";
import type { WorkoutTemplate } from "../api/types";
import { colors, radius } from "../theme/tokens";
import { Button } from "./Button";

export function RoutineCard({
  template,
  onClone,
  onEdit,
  onStart,
}: {
  template: WorkoutTemplate;
  onClone: () => void;
  onEdit: () => void;
  onStart: () => void;
}) {
  const setCount = template.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const estimatedDays = Math.max(2, Math.min(6, template.exercises.length));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.meta}>
            {template.exercises.length} ejercicios · {setCount} series · {estimatedDays}d/sem
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Plan</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Objetivo</Text>
          <Text style={styles.summaryValue}>General</Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Volumen</Text>
          <Text style={styles.summaryValue}>{setCount} series</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Empezar" onPress={onStart} />
        <Button label="Editar" variant="ghost" onPress={onEdit} />
        <Button label="Clonar" variant="secondary" onPress={onClone} />
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
    gap: 12,
    padding: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  badge: {
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.lime,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryPill: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
