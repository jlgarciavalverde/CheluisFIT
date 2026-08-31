import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, Plus, TimerOff } from "lucide-react-native";
import type { Exercise, WorkoutSet } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { showError } from "../utils/errors";
import { completedSets, formatDuration, totalSets, totalVolume } from "../utils/workout";
import { useToast } from "../contexts/ToastContext";
import { useWorkout } from "../contexts/WorkoutContext";
import { ActiveWorkoutExerciseCard } from "../components/ActiveWorkoutExerciseCard";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { RestTimerRing } from "../components/RestTimerRing";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SetEditorSheet } from "../components/SetEditorSheet";
import { StatStrip } from "../components/StatStrip";
import { TextField } from "../components/TextField";
import { WorkoutExercisePicker } from "../components/WorkoutExercisePicker";
import { WorkoutProgressBar } from "../components/WorkoutProgressBar";
import { WorkoutSummaryPanel } from "../components/WorkoutSummaryPanel";
import { colors, withOpacity } from "../theme/tokens";

export function ActiveWorkoutScreen() {
  const { apiFetch } = useAuth();
  const showToast = useToast();
  const {
    activeSession: session,
    loadActiveSession,
    restLeft,
    restTotal,
    adjustRest,
    skipRest,
    startRest,
  } = useWorkout();
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const lastSyncedNotes = useRef("");
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    const nextNotes = session?.notes ?? "";
    lastSyncedNotes.current = nextNotes;
    setSessionNotes(nextNotes);
  }, [session?.id, session?.notes]);

  useEffect(() => {
    if (!session || sessionNotes === lastSyncedNotes.current) return;

    const timer = setTimeout(() => {
      apiFetch(`/workout-sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: sessionNotes.trim() ? sessionNotes : null }),
      })
        .then(() => {
          lastSyncedNotes.current = sessionNotes;
        })
        .catch(showError);
    }, 650);

    return () => clearTimeout(timer);
  }, [apiFetch, session, sessionNotes]);

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

  const nextSetId = getNextSetId(session);

  const completeSet = async (setId: string, restSeconds: number) => {
    await apiFetch(`/workout-sessions/${session.id}/sets/${setId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });
    startRest(restSeconds);
    loadActiveSession();
    showToast("Serie completada");
  };

  const editSet = async (
    set: WorkoutSet,
    input: Omit<WorkoutSet, "id" | "setNumber" | "completedAt">,
  ) => {
    await apiFetch(`/workout-sessions/${session.id}/sets/${set.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setEditingSet(null);
    loadActiveSession();
    showToast("Serie actualizada");
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
    loadActiveSession();
    showToast("Serie anadida");
  };

  const addExercise = async (exercise: Exercise) => {
    await apiFetch(`/workout-sessions/${session.id}/exercises`, {
      method: "POST",
      body: JSON.stringify({
        exerciseId: exercise.id,
        sets: [{ weightKg: 0, reps: 10, type: "NORMAL", restSeconds: 90 }],
      }),
    });
    loadActiveSession();
    showToast("Ejercicio anadido");
  };

  const completeWorkout = () => {
    Alert.alert("Completar entreno", "Se marcara como terminado. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Completar",
        onPress: () => {
          apiFetch(`/workout-sessions/${session.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "COMPLETED" }),
          })
            .then(() => {
              loadActiveSession();
              showToast("Entreno completado");
            })
            .catch(showError);
        },
      },
    ]);
  };

  return (
    <Screen>
      <Section title="Entreno actual">
        <Text style={styles.meta}>
          {formatDate(session.startedAt)} ·{" "}
          {session.status === "COMPLETED" ? "Completado" : "En progreso"}
        </Text>
        <StatStrip
          items={[
            { label: "Series", value: `${completedSets(session)}/${totalSets(session)}` },
            { label: "Volumen", value: `${Math.round(totalVolume(session))} kg` },
            { label: "Duracion", value: formatDuration(session.startedAt) },
          ]}
        />
        <WorkoutProgressBar
          completed={countCompletedExercises(session)}
          total={session.exercises.length}
        />
        <TextField
          placeholder="Notas del entreno"
          value={sessionNotes}
          onChangeText={setSessionNotes}
          multiline
        />
        {restTotal > 0 ? (
          <View style={styles.restPanel}>
            <View style={styles.restContent}>
              <RestTimerRing secondsLeft={restLeft} totalSeconds={restTotal} />
              <View style={styles.restInfo}>
                <Text style={styles.restTitle}>
                  {restLeft > 0 ? "Descansando..." : "Descanso terminado"}
                </Text>
                <View style={styles.restActions}>
                  <Button label="-15s" size="sm" variant="ghost" onPress={() => adjustRest(-15)} />
                  <Button label="+15s" size="sm" variant="ghost" onPress={() => adjustRest(15)} />
                  <Button
                    icon={TimerOff}
                    label="Saltar"
                    size="sm"
                    variant="secondary"
                    onPress={skipRest}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : null}
        <Button
          icon={Plus}
          label="Anadir ejercicio"
          variant="secondary"
          onPress={() => setPickerOpen(true)}
        />
      </Section>

      <WorkoutSummaryPanel summary={session.muscleSummary} />

      <Section title="Ejercicios">
        {session.exercises.map((exercise) => (
          <ActiveWorkoutExerciseCard
            key={exercise.id}
            workoutExercise={exercise}
            nextSetId={nextSetId}
            onAddSet={(workoutExercise) =>
              addSet(
                workoutExercise.id,
                workoutExercise.sets[workoutExercise.sets.length - 1],
              ).catch(showError)
            }
            onCompleteSet={(setId, restSeconds) => completeSet(setId, restSeconds).catch(showError)}
            onEditSet={setEditingSet}
          />
        ))}
      </Section>

      <Button icon={CheckCircle2} label="Completar entreno" onPress={completeWorkout} />

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
  const d = new Date(value);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function getNextSetId(session: {
  exercises: Array<{ sets: Array<{ id: string; completedAt: string | null }> }>;
}) {
  for (const exercise of session.exercises) {
    const nextSet = exercise.sets.find((set) => !set.completedAt);
    if (nextSet) return nextSet.id;
  }
  return null;
}

function countCompletedExercises(session: {
  exercises: Array<{ sets: Array<{ completedAt: string | null }> }>;
}) {
  return session.exercises.filter((exercise) =>
    exercise.sets.every((set) => set.completedAt !== null),
  ).length;
}

const styles = StyleSheet.create({
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  restPanel: {
    backgroundColor: withOpacity(colors.cyan, 0.07),
    borderColor: colors.cyan,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  restContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  restInfo: {
    flex: 1,
    gap: 8,
  },
  restTitle: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: "900",
  },
  restActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
