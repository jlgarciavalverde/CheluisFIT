import { Plus, Save, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { Exercise, ExerciseSetType, WorkoutSet, WorkoutTemplate } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import {
  RoutineBuilderExercise,
  RoutineBuilderSet,
  RoutineExerciseBlock,
} from "../components/RoutineExerciseBlock";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SetEditorSheet } from "../components/SetEditorSheet";
import { TextField } from "../components/TextField";
import { WorkoutExercisePicker } from "../components/WorkoutExercisePicker";
import { colors } from "../theme/tokens";

type EditingSet = {
  exerciseClientId: string;
  set: RoutineBuilderSet;
};

export function RoutineBuilderScreen({
  template,
  onCancel,
  onSaved,
}: {
  template?: WorkoutTemplate | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useAuth();
  const [name, setName] = useState(template?.name ?? "Rutina nueva");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [exercises, setExercises] = useState<RoutineBuilderExercise[]>(
    () => templateToBuilderExercises(template),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<EditingSet | null>(null);

  const totals = useMemo(() => {
    const setCount = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const effectiveSets = exercises.reduce(
      (total, exercise) => total + exercise.sets.filter((set) => set.type !== "WARMUP").length,
      0,
    );
    const estimatedMinutes = Math.max(
      Math.round(exercises.length * 4 + setCount * 1.5),
      exercises.length ? 20 : 0,
    );

    return { exercises: exercises.length, sets: setCount, effectiveSets, estimatedMinutes };
  }, [exercises]);

  const addExercise = (exercise: Exercise) => {
    setExercises([
      ...exercises,
      {
        clientId: createClientId(),
        exerciseId: exercise.id,
        exercise,
        sets: [createDefaultSet()],
      },
    ]);
  };

  const save = async () => {
    if (exercises.length === 0 || exercises.some((exercise) => exercise.sets.length === 0)) {
      Alert.alert("Rutina incompleta", "Anade al menos un ejercicio y una serie.");
      return;
    }

    await apiFetch(template ? `/workout-templates/${template.id}` : "/workout-templates", {
      method: template ? "PUT" : "POST",
      body: JSON.stringify({
        name,
        notes: notes || undefined,
        exercises: exercises.map((exercise, exerciseIndex) => ({
          exerciseId: exercise.exerciseId,
          order: exerciseIndex + 1,
          sets: exercise.sets.map((set, setIndex) => ({
            setNumber: setIndex + 1,
            targetWeightKg: set.targetWeightKg,
            targetReps: set.targetReps,
            type: set.type,
            restSeconds: set.restSeconds,
          })),
        })),
      }),
    });
    onSaved();
  };

  return (
    <Screen>
      <Section title={template ? "Editar rutina" : "Crear rutina"}>
        <TextField value={name} onChangeText={setName} />
        <TextField value={notes} onChangeText={setNotes} placeholder="Notas" />
        <Text style={styles.meta}>
          Paso 1 de 4 · Datos, ejercicios, series y revision
        </Text>
        <Text style={styles.meta}>
          {totals.exercises} ejercicios · {totals.sets} series objetivo · {totals.effectiveSets} efectivas · {totals.estimatedMinutes} min
        </Text>
        <View style={styles.actions}>
          <Button icon={Plus} label="Anadir ejercicio" onPress={() => setPickerOpen(true)} />
          <Button icon={X} label="Cancelar" variant="ghost" onPress={onCancel} />
        </View>
      </Section>

      <Section title="Presets rapidos">
        <View style={styles.actions}>
          <Button label="3x10" variant="secondary" onPress={() => applyPreset(3, 10)} />
          <Button label="4x8" variant="secondary" onPress={() => applyPreset(4, 8)} />
          <Button label="5x5" variant="secondary" onPress={() => applyPreset(5, 5)} />
          <Button label="Warm + 3" variant="secondary" onPress={applyWarmupPreset} />
        </View>
      </Section>

      <Section title="Bloques">
        {exercises.length === 0 ? (
          <Text style={styles.meta}>Anade ejercicios para construir tu rutina.</Text>
        ) : (
          exercises.map((exercise, index) => (
            <RoutineExerciseBlock
              key={exercise.clientId}
              item={exercise}
              index={index}
              canMoveUp={index > 0}
              canMoveDown={index < exercises.length - 1}
              onAddSet={() => addSet(exercise.clientId)}
              onDuplicateExercise={() => duplicateExercise(exercise.clientId)}
              onDuplicateSet={(set) => duplicateSet(exercise.clientId, set)}
              onEditSet={(set) => setEditingSet({ exerciseClientId: exercise.clientId, set })}
              onMoveDown={() => moveExercise(index, 1)}
              onMoveUp={() => moveExercise(index, -1)}
              onRemoveExercise={() => removeExercise(exercise.clientId)}
              onRemoveSet={(set) => removeSet(exercise.clientId, set.clientId)}
            />
          ))
        )}
      </Section>

      <Button icon={Save} label="Guardar rutina" onPress={() => save().catch(showError)} />

      <WorkoutExercisePicker
        apiFetch={apiFetch}
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
      />

      <SetEditorSheet
        visible={Boolean(editingSet)}
        set={editingSet ? builderSetToWorkoutSet(editingSet.set) : null}
        onClose={() => setEditingSet(null)}
        onSave={(input) => {
          if (editingSet) {
            updateSet(editingSet.exerciseClientId, editingSet.set.clientId, input);
          }
          setEditingSet(null);
        }}
      />
    </Screen>
  );

  function addSet(exerciseClientId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.clientId === exerciseClientId
          ? { ...exercise, sets: [...exercise.sets, createDefaultSet(exercise.sets.at(-1))] }
          : exercise,
      ),
    );
  }

  function duplicateSet(exerciseClientId: string, set: RoutineBuilderSet) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.clientId === exerciseClientId
          ? { ...exercise, sets: [...exercise.sets, { ...set, clientId: createClientId() }] }
          : exercise,
      ),
    );
  }

  function duplicateExercise(exerciseClientId: string) {
    const exercise = exercises.find((item) => item.clientId === exerciseClientId);
    if (!exercise) return;

    const index = exercises.findIndex((item) => item.clientId === exerciseClientId);
    const copy = {
      ...exercise,
      clientId: createClientId(),
      sets: exercise.sets.map((set) => ({ ...set, clientId: createClientId() })),
    };
    const next = [...exercises];
    next.splice(index + 1, 0, copy);
    setExercises(next);
  }

  function applyPreset(setCount: number, reps: number) {
    setExercises((current) =>
      current.map((exercise) => ({
        ...exercise,
        sets: Array.from({ length: setCount }).map(() => ({
          clientId: createClientId(),
          targetWeightKg: exercise.sets[0]?.targetWeightKg ?? 60,
          targetReps: reps,
          type: "NORMAL" as const,
          restSeconds: exercise.sets[0]?.restSeconds ?? 90,
        })),
      })),
    );
  }

  function applyWarmupPreset() {
    setExercises((current) =>
      current.map((exercise) => {
        const baseWeight = exercise.sets[0]?.targetWeightKg ?? 60;
        return {
          ...exercise,
          sets: [
            {
              clientId: createClientId(),
              targetWeightKg: Math.max(Math.round(baseWeight * 0.55), 0),
              targetReps: 10,
              type: "WARMUP",
              restSeconds: 60,
            },
            ...Array.from({ length: 3 }).map(() => ({
              clientId: createClientId(),
              targetWeightKg: baseWeight,
              targetReps: 8,
              type: "NORMAL" as const,
              restSeconds: 120,
            })),
          ],
        };
      }),
    );
  }

  function updateSet(
    exerciseClientId: string,
    setClientId: string,
    input: { weightKg: number; reps: number; type: ExerciseSetType; restSeconds: number },
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.clientId === exerciseClientId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.clientId === setClientId
                  ? {
                      ...set,
                      targetWeightKg: input.weightKg,
                      targetReps: input.reps,
                      type: input.type,
                      restSeconds: input.restSeconds,
                    }
                  : set,
              ),
            }
          : exercise,
      ),
    );
  }

  function removeExercise(exerciseClientId: string) {
    setExercises((current) =>
      current.filter((exercise) => exercise.clientId !== exerciseClientId),
    );
  }

  function removeSet(exerciseClientId: string, setClientId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.clientId === exerciseClientId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.clientId !== setClientId),
            }
          : exercise,
      ),
    );
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= exercises.length) return;

    const next = [...exercises];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setExercises(next);
  }
}

function templateToBuilderExercises(template?: WorkoutTemplate | null): RoutineBuilderExercise[] {
  return (
    template?.exercises.map((templateExercise) => ({
      clientId: createClientId(),
      exerciseId: templateExercise.exerciseId,
      exercise: {
        id: templateExercise.exerciseId,
        name: templateExercise.exercise.name,
        targetMuscles: templateExercise.exercise.targetMuscles ?? [],
        equipment: templateExercise.exercise.equipment ?? [],
      },
      sets: templateExercise.sets.map((set) => ({
        clientId: createClientId(),
        targetWeightKg: set.targetWeightKg ?? 0,
        targetReps: set.targetReps ?? 1,
        type: set.type,
        restSeconds: set.restSeconds,
      })),
    })) ?? []
  );
}

function createDefaultSet(previous?: RoutineBuilderSet): RoutineBuilderSet {
  return {
    clientId: createClientId(),
    targetWeightKg: previous?.targetWeightKg ?? 60,
    targetReps: previous?.targetReps ?? 10,
    type: previous?.type ?? "NORMAL",
    restSeconds: previous?.restSeconds ?? 90,
  };
}

function builderSetToWorkoutSet(set: RoutineBuilderSet): WorkoutSet {
  return {
    id: set.clientId,
    setNumber: 1,
    weightKg: set.targetWeightKg,
    reps: set.targetReps,
    type: set.type,
    restSeconds: set.restSeconds,
    completedAt: null,
  };
}

function createClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
});
