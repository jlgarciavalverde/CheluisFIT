import { Copy, Dumbbell, Pencil, Trash2 } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutTemplate } from "../api/types";
import { colors, radius, shadow, withOpacity } from "../theme/tokens";
import { Button } from "./Button";

export const RoutineCard = memo(function RoutineCard({
  template,
  onClone,
  onDelete,
  onEdit,
  onOpen,
  onStart,
}: {
  template: WorkoutTemplate;
  onClone: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onOpen?: () => void;
  onStart: () => void;
}) {
  const setCount = template.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const estimatedMinutes = Math.max(Math.round(template.exercises.length * 4 + setCount * 1.5), 20);

  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.meta}>
            {template.exercises.length} ejercicios · {setCount} series
          </Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{estimatedMinutes} min</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Vista rápida</Text>
        <Text style={styles.summaryText}>
          {template.exercises.length} ejercicios · {setCount} series · {estimatedMinutes} min
        </Text>
      </View>

      <View style={styles.actions}>
        <Button icon={Dumbbell} label="Empezar" onPress={onStart} />
        <Button icon={Pencil} label="Editar" variant="ghost" onPress={onEdit} />
        <Button icon={Copy} label="Clonar" variant="secondary" onPress={onClone} />
        <Button icon={Trash2} label="Eliminar" variant="ghost" onPress={onDelete} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 12,
    ...shadow.card,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
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
    fontWeight: "600",
  },
  pill: {
    backgroundColor: withOpacity(colors.cyan, 0.10),
    borderColor: colors.cyan,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  summaryText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
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
    flexWrap: "wrap",
    gap: 8,
  },
});
