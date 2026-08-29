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

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{template.name}</Text>
        <Text style={styles.meta}>
          {template.exercises.length} ejercicios · {setCount} series
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Editar" variant="ghost" onPress={onEdit} />
        <Button label="Clonar" variant="secondary" onPress={onClone} />
        <Button label="Empezar" onPress={onStart} />
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
  copy: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
