import { StyleSheet, Text, View } from "react-native";
import type { Exercise, ExerciseSetType } from "../api/types";
import { colors, radius } from "../theme/tokens";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { getSetTypeColor, SetTypeChip } from "./SetTypeChip";

export type RoutineBuilderSet = {
  clientId: string;
  targetWeightKg: number;
  targetReps: number;
  type: ExerciseSetType;
  restSeconds: number;
};

export type RoutineBuilderExercise = {
  clientId: string;
  exerciseId: string;
  exercise: Pick<Exercise, "id" | "name" | "targetMuscles" | "equipment">;
  sets: RoutineBuilderSet[];
};

export function RoutineExerciseBlock({
  item,
  index,
  canMoveUp,
  canMoveDown,
  onAddSet,
  onDuplicateSet,
  onEditSet,
  onMoveDown,
  onMoveUp,
  onRemoveExercise,
  onRemoveSet,
}: {
  item: RoutineBuilderExercise;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddSet: () => void;
  onDuplicateSet: (set: RoutineBuilderSet) => void;
  onEditSet: (set: RoutineBuilderSet) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemoveExercise: () => void;
  onRemoveSet: (set: RoutineBuilderSet) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>#{index + 1}</Text>
          <Text style={styles.title}>{item.exercise.name}</Text>
          <Text style={styles.meta}>
            {item.exercise.targetMuscles.join(", ") || "Músculo principal"} · {item.exercise.equipment.join(", ") || "Sin equipo"}
          </Text>
        </View>

        <View style={[styles.iconRow, !(canMoveUp || canMoveDown) && styles.iconRowDisabled]}>
          <IconButton label="Subir ejercicio" symbol="↑" onPress={onMoveUp} />
          <IconButton label="Bajar ejercicio" symbol="↓" onPress={onMoveDown} />
        </View>
      </View>

      <View style={styles.sets}>
        {item.sets.map((set, setIndex) => (
          <View key={set.clientId} style={[styles.setRow, { borderColor: getSetTypeColor(set.type) }]}>
            <Text style={[styles.setSummary, { color: getSetTypeColor(set.type) }]}>Serie {setIndex + 1}</Text>
            <Text style={styles.setValue}>{set.targetWeightKg} kg × {set.targetReps}</Text>
            <SetTypeChip type={set.type} compact />
            <Text style={styles.rest}>{set.restSeconds}s</Text>

            <View style={styles.inlineActions}>
              <Button size="sm" label="Editar" variant="ghost" onPress={() => onEditSet(set)} />
              <Button size="sm" label="DUP" variant="ghost" onPress={() => onDuplicateSet(set)} />
              <Button size="sm" label="Borrar" variant="ghost" onPress={() => onRemoveSet(set)} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Añadir serie" variant="secondary" onPress={onAddSet} />
        <Button label="Quitar ejercicio" variant="ghost" onPress={onRemoveExercise} />
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
    padding: 12,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  kicker: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  iconRow: {
    flexDirection: "row",
    gap: 6,
  },
  iconRowDisabled: {
    opacity: 0.45,
  },
  sets: {
    gap: 8,
  },
  setRow: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 8,
  },
  setSummary: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  setValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  rest: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  inlineActions: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
