import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type {
  Exercise,
  ExerciseSetType,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
} from "../api/types";
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

const GOALS = ["Hipertrofia", "Fuerza", "Resistencia", "Definición"];
const FREQUENCIES = [2, 3, 4, 5, 6];

export function RoutineBuilderScreen({
  template,
  seedSession,
  onCancel,
  onSaved,
}: {
  template?: WorkoutTemplate | null;
  seedSession?: WorkoutSession | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useAuth();
  const [name, setName] = useState(
    template?.name ??
      (seedSession ? `Rutina ${formatShortDate(seedSession.performedAt)}` : "Rutina nueva"),
  );
  const [notes, setNotes] = useState(
    template?.notes ??
      (seedSession ? `Basada en el entrenamiento del ${formatLongDate(seedSession.performedAt)}` : ""),
  );
  const [goal, setGoal] = useState("Hipertrofia");
  const [weeklyFrequency, setWeeklyFrequency] = useState(4);
  const [exercises, setExercises] = useState<RoutineBuilderExercise[]>(() =>
    template ? templateToBuilderExercises(template) : sessionToBuilderExercises(seedSession),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<EditingSet | null>(null);

  const totals = useMemo(() => {
    const setCount = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    return { exercises: exercises.length, sets: setCount };
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
        goal,
        weeklyFrequency,
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
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>
          {template ? "Editar rutina" : seedSession ? "Desde entrenamiento previo" : "Crear rutina"}
        </Text>
        <Text style={styles.title}>{name || "Rutina nueva"}</Text>
        <Text style={styles.subtitle}>
          {seedSession
            ? `Base recuperada del ${formatLongDate(seedSession.performedAt)}`
            : "Crea un plan semanal con objetivos, ejercicios y series."}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen del plan</Text>
        <View style={styles.summaryRow}>
          <SummaryStat label="Objetivo" value={goal} />
          <SummaryStat label="Frecuencia" value={`${weeklyFrequency}d/sem`} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryStat label="Ejercicios" value={String(totals.exercises)} />
          <SummaryStat label="Series" value={String(totals.sets)} />
        </View>
      </View>

      <Section title="Configuración">
        <TextField value={name} onChangeText={setName} placeholder="Nombre de la rutina" />
        <TextField value={notes} onChangeText={setNotes} placeholder="Notas del plan" />

        <View style={styles.selectorGroup}>
          <Text style={styles.label}>Objetivo</Text>
          <View style={styles.optionRow}>
            {GOALS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setGoal(option)}
                style={[styles.optionChip, goal === option && styles.optionChipActive]}
              >
                <Text style={[styles.optionText, goal === option && styles.optionTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.selectorGroup}>
          <Text style={styles.label}>Frecuencia semanal</Text>
          <View style={styles.optionRow}>
            {FREQUENCIES.map((option) => (
              <Pressable
                key={option}
                onPress={() => setWeeklyFrequency(option)}
                style={[styles.roundChip, weeklyFrequency === option && styles.roundChipActive]}
              >
                <Text style={[styles.roundText, weeklyFrequency === option && styles.roundTextActive]}>
                  {option}d
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.meta}>
          {totals.exercises} ejercicios · {totals.sets} series objetivo
        </Text>
        <View style={styles.actions}>
          <Button label="Añadir ejercicio" onPress={() => setPickerOpen(true)} />
          <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        </View>
      </Section>

      <Section title="Bloques">
        {exercises.length === 0 ? (
          <Text style={styles.meta}>Añade ejercicios para construir tu rutina.</Text>
        ) : (
          exercises.map((exercise, index) => (
            <RoutineExerciseBlock
              key={exercise.clientId}
              item={exercise}
              index={index}
              canMoveUp={index > 0}
              canMoveDown={index < exercises.length - 1}
              onAddSet={() => addSet(exercise.clientId)}
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

      <Button label="Guardar plan" onPress={() => save().catch(showError)} />

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
        gifUrl: templateExercise.exercise.gifUrl ?? "",
        secondaryMuscles: templateExercise.exercise.secondaryMuscles ?? [],
        bodyParts: templateExercise.exercise.bodyParts ?? [],
        instructions: [],
        tips: [],
        externalId: "",
        source: "",
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

function sessionToBuilderExercises(session?: WorkoutSession | null): RoutineBuilderExercise[] {
  if (!session) return [];

  return session.exercises.map((entry) => ({
    clientId: createClientId(),
    exerciseId: entry.exerciseId,
    exercise: {
      id: entry.exerciseId,
      name: entry.exercise.name,
      gifUrl: entry.exercise.gifUrl ?? "",
      targetMuscles: entry.exercise.targetMuscles ?? [],
      secondaryMuscles: entry.exercise.secondaryMuscles ?? [],
      bodyParts: entry.exercise.bodyParts ?? [],
      equipment: entry.exercise.equipment ?? [],
      instructions: [],
      tips: [],
      externalId: entry.exerciseId,
      source: "history",
    },
    sets: entry.sets.map((set) => ({
      clientId: createClientId(),
      targetWeightKg: set.weightKg ?? 0,
      targetReps: set.reps ?? 1,
      type: set.type ?? "NORMAL",
      restSeconds: set.restSeconds ?? 90,
    })),
  }));
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

function formatShortDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatLongDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

function SummaryStat({ label, value }: { label: string; value: string }) {
return (
  <View style={styles.summaryStat}>
    <Text style={styles.summaryStatLabel}>{label}</Text>
    <Text style={styles.summaryStatValue}>{value}</Text>
  </View>
);
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryStat: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryStatLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  summaryStatValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  selectorGroup: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionChipActive: {
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
  },
  optionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  optionTextActive: {
    color: colors.lime,
  },
  roundChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    minWidth: 42,
  },
  roundChipActive: {
    backgroundColor: `${colors.cyan}1A`,
    borderColor: colors.cyan,
  },
  roundText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  roundTextActive: {
    color: colors.cyan,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
});
