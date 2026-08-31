import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { Exercise, ExerciseSetType } from "../api/types";
import { colors, radius, withOpacity } from "../theme/tokens";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { MuscleChip } from "./MuscleChip";
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
  onDuplicateExercise,
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
  onDuplicateExercise: () => void;
  onEditSet: (set: RoutineBuilderSet) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemoveExercise: () => void;
  onRemoveSet: (set: RoutineBuilderSet) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{item.exercise.name}</Text>
          <View style={styles.chipRow}>
            {item.exercise.targetMuscles.slice(0, 2).map((muscle) => (
              <MuscleChip key={muscle} label={muscle} type="primary" />
            ))}
            {item.exercise.equipment.length > 0 ? (
              <Text style={styles.equipmentText}>{item.exercise.equipment[0]}</Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.iconRow, !(canMoveUp || canMoveDown) && styles.iconRowDisabled]}>
          <IconButton label="Subir ejercicio" icon={ArrowUp} onPress={onMoveUp} />
          <IconButton label="Bajar ejercicio" icon={ArrowDown} onPress={onMoveDown} />
        </View>
      </View>

      <View style={styles.sets}>
        {item.sets.map((set) => (
          <View
            key={set.clientId}
            style={[styles.setRow, { borderColor: getSetTypeColor(set.type) }]}
          >
            <Text style={[styles.setSummary, { color: getSetTypeColor(set.type) }]}>
              {set.targetWeightKg}x{set.targetReps}
            </Text>
            <SetTypeChip type={set.type} compact />
            <Text style={styles.rest}>{set.restSeconds}s</Text>
            <IconButton label="Editar serie" icon={Pencil} onPress={() => onEditSet(set)} />
            <IconButton label="Duplicar serie" icon={Copy} onPress={() => onDuplicateSet(set)} />
            <IconButton label="Eliminar serie" icon={Trash2} onPress={() => onRemoveSet(set)} />
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button icon={Plus} label="Serie" variant="secondary" onPress={onAddSet} />
        <Button icon={Copy} label="Duplicar" variant="ghost" onPress={onDuplicateExercise} />
        <Button icon={Trash2} label="Eliminar" variant="ghost" onPress={onRemoveExercise} />
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
  numberBadge: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.lime, 0.12),
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  numberText: {
    color: colors.lime,
    fontSize: 13,
    fontWeight: "900",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  chipRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  equipmentText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
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
    fontSize: 14,
    fontWeight: "900",
  },
  rest: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
