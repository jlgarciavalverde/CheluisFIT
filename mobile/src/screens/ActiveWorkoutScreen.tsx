import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { Exercise, WorkoutSession, WorkoutSet } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { ActiveWorkoutExerciseCard } from "../components/ActiveWorkoutExerciseCard";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SetEditorSheet } from "../components/SetEditorSheet";
import { StatStrip } from "../components/StatStrip";
import { WorkoutExercisePicker } from "../components/WorkoutExercisePicker";
import { WorkoutSummaryPanel } from "../components/WorkoutSummaryPanel";
import { colors } from "../theme/tokens";

export function ActiveWorkoutScreen({
  session,
  onActiveChange,
  onStartRest,
  setMessage,
}: {
  session: WorkoutSession | null;
  onActiveChange: () => void;
  onStartRest: (seconds: number) => void;
  setMessage: (value: string) => void;
}) {
  const { apiFetch } = useAuth();
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!session) {
    return (
      <Screen>
        <EmptyState
          title="No hay entreno activo"
          message="Empieza uno desde una rutina o crea una rutina nueva."
        />
      </Screen>
    );
  }

  const completeSet = async (setId: string, restSeconds: number) => {
    await apiFetch(`/workout-sessions/${session.id}/sets/${setId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });
    onStartRest(restSeconds);
    onActiveChange();
    setMessage("Serie completada");
  };

  const editSet = async (set: WorkoutSet, input: Omit<WorkoutSet, "id" | "setNumber" | "completedAt">) => {
    await apiFetch(`/workout-sessions/${session.id}/sets/${set.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setEditingSet(null);
    onActiveChange();
    setMessage("Serie actualizada");
  };

  const addSet = async (workoutExerciseId: string, lastSet?: WorkoutSet) => {
    await apiFetch(`/workout-sessions/${session.id}/exercises/${workoutExerciseId}/sets`, {
      method: "POST",
      body: JSON.stringify({
        weightKg: lastSet?.weightKg ?? 0,
        reps: lastSet?.reps ?? 10,
        type: lastSet?.type ?? "NORMAL",
        restSeconds: lastSet?.restSeconds ?? 90,
      }),
    });
    onActiveChange();
    setMessage("Serie anadida");
  };

  const addExercise = async (exercise: Exercise) => {
    await apiFetch(`/workout-sessions/${session.id}/exercises`, {
      method: "POST",
      body: JSON.stringify({
        exerciseId: exercise.id,
        sets: [{ weightKg: 0, reps: 10, type: "NORMAL", restSeconds: 90 }],
      }),
    });
    onActiveChange();
    setMessage("Ejercicio anadido");
  };

  const completeWorkout = async () => {
    await apiFetch(`/workout-sessions/${session.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    onActiveChange();
    setMessage("Entreno completado");
  };

  return (
    <Screen>
      <Section title="Entreno actual">
        <Text style={styles.meta}>{formatDate(session.startedAt)} · {session.status}</Text>
        <StatStrip
          items={[
            { label: "Series", value: `${completedSets(session)}/${totalSets(session)}` },
            { label: "Volumen", value: `${Math.round(totalVolume(session))} kg` },
            { label: "Duracion", value: formatDuration(session.startedAt) },
          ]}
        />
        <Button label="Anadir ejercicio" variant="secondary" onPress={() => setPickerOpen(true)} />
      </Section>

      <WorkoutSummaryPanel summary={session.muscleSummary} />

      <Section title="Ejercicios">
        {session.exercises.map((exercise) => (
          <ActiveWorkoutExerciseCard
            key={exercise.id}
            workoutExercise={exercise}
            onAddSet={(workoutExercise) =>
              addSet(workoutExercise.id, workoutExercise.sets.at(-1)).catch(showError)
            }
            onCompleteSet={(setId, restSeconds) =>
              completeSet(setId, restSeconds).catch(showError)
            }
            onEditSet={setEditingSet}
          />
        ))}
      </Section>

      <Button label="Completar entreno" onPress={() => completeWorkout().catch(showError)} />

      <WorkoutExercisePicker
        apiFetch={apiFetch}
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exercise) => addExercise(exercise).catch(showError)}
      />

      <SetEditorSheet
        visible={Boolean(editingSet)}
        set={editingSet}
        onClose={() => setEditingSet(null)}
        onSave={(input) => {
          if (editingSet) editSet(editingSet, input).catch(showError);
        }}
      />
    </Screen>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

function totalSets(session: WorkoutSession) {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

function completedSets(session: WorkoutSession) {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completedAt).length,
    0,
  );
}

function totalVolume(session: WorkoutSession) {
  return session.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal +
      exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + set.weightKg * set.reps, 0),
    0,
  );
}

function formatDuration(startedAt: string) {
  const diffMs = Math.max(Date.now() - new Date(startedAt).getTime(), 0);
  const minutes = Math.floor(diffMs / 60000);
  return `${minutes}m`;
}

const styles = StyleSheet.create({
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
