import { Plus, Star } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import type { Exercise, ProgressionSuggestion, ProgressPoint, WorkoutSession } from "../api/types";
import type { ApiFetch } from "../api/types";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ProgressChart } from "../components/ProgressChart";
import { Section } from "../components/Section";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { StatStrip } from "../components/StatStrip";
import { colors, radius, shadow } from "../theme/tokens";

export function ExerciseDetailScreen({
  apiFetch,
  exercise,
  favorite,
  history,
  metric,
  progress,
  progression,
  onBack,
  onMetricChange,
  onToggleFavorite,
  onAddToActiveWorkout,
  setMessage,
}: {
  apiFetch: ApiFetch;
  exercise: Exercise;
  favorite: boolean;
  history: WorkoutSession[];
  metric: "weight" | "volume";
  progress: ProgressPoint[];
  progression: ProgressionSuggestion | null;
  onBack: () => void;
  onMetricChange: (metric: "weight" | "volume") => void;
  onToggleFavorite: () => void;
  onAddToActiveWorkout: () => void;
  setMessage: (value: string) => void;
}) {
  const [tab, setTab] = useState<"info" | "progress" | "history" | "routine">("progress");
  const chartValues =
    metric === "weight"
      ? progress.map((point) => point.maxWeightKg)
      : progress.map((point) => point.totalVolumeKg);
  const lastProgress = progress.at(-1);

  const createRoutineFromExercise = async () => {
    await apiFetch("/workout-templates", {
      method: "POST",
      body: JSON.stringify({
        name: `${exercise.name} base`,
        exercises: [
          {
            exerciseId: exercise.id,
            sets: [
              { targetWeightKg: lastProgress?.maxWeightKg ?? 0, targetReps: 10, type: "NORMAL", restSeconds: 90 },
              { targetWeightKg: lastProgress?.maxWeightKg ?? 0, targetReps: 10, type: "NORMAL", restSeconds: 90 },
              { targetWeightKg: lastProgress?.maxWeightKg ?? 0, targetReps: 10, type: "NORMAL", restSeconds: 90 },
            ],
          },
        ],
      }),
    });
    setMessage("Rutina creada desde ejercicio");
  };

  return (
    <>
      <Section title={exercise.name}>
        <View style={styles.summaryCard}>
          <Image source={{ uri: exercise.gifUrl }} style={styles.image} resizeMode="contain" />
          <Text style={styles.meta}>
            {exercise.targetMuscles.join(", ")} · {exercise.equipment.join(", ")}
          </Text>
          <StatStrip
            items={[
              { label: "PR", value: `${lastProgress?.maxWeightKg ?? 0} kg` },
              { label: "Sesiones", value: history.length },
              { label: "Fav", value: favorite ? "Sí" : "No" },
            ]}
          />
          <View style={styles.actions}>
            <Button label="Volver" variant="ghost" onPress={onBack} />
            <Button
              icon={Star}
              variant="secondary"
              label={favorite ? "Quitar fav" : "Favorito"}
              onPress={onToggleFavorite}
            />
          </View>
          <View style={styles.actions}>
            <Button
              icon={Plus}
              label="Anadir al entreno"
              onPress={onAddToActiveWorkout}
            />
            <Button
              label="Crear rutina"
              variant="secondary"
              onPress={() => createRoutineFromExercise().catch(showError)}
            />
          </View>
        </View>
      </Section>

      <SegmentedTabs
        tabs={[
          { key: "progress", label: "Progreso" },
          { key: "info", label: "Info" },
          { key: "history", label: "Historial" },
          { key: "routine", label: "Rutina" },
        ]}
        value={tab}
        onChange={(key) => setTab(key as typeof tab)}
      />

      {tab === "progress" ? (
        <Section title="Progreso">
          <SegmentedTabs
            tabs={[
              { key: "weight", label: "Peso" },
              { key: "volume", label: "Volumen" },
            ]}
            value={metric}
            onChange={(key) => onMetricChange(key as "weight" | "volume")}
          />
          <View style={styles.chartCard}>
            <ProgressChart
              values={chartValues}
              labels={progress.map((point) => new Date(point.performedAt).toLocaleDateString())}
            />
          </View>
          {progression ? (
            <View style={styles.suggestion}>
              <Text style={styles.suggestionTitle}>Sobrecarga sugerida</Text>
              <Text style={styles.meta}>{progression.message}</Text>
              {progression.suggestion?.sets.slice(0, 4).map((set) => (
                <Text key={set.setNumber} style={styles.suggestionSet}>
                  S{set.setNumber}: {set.weightKg} kg x {set.reps}
                </Text>
              ))}
            </View>
          ) : null}
        </Section>
      ) : null}

      {tab === "info" ? (
        <Section title="Instrucciones">
          {exercise.instructions.length === 0 ? (
            <EmptyState title="Sin instrucciones" />
          ) : (
            exercise.instructions.slice(0, 6).map((instruction, index) => (
              <Text key={`${instruction}-${index}`} style={styles.instruction}>
                {index + 1}. {instruction}
              </Text>
            ))
          )}
        </Section>
      ) : null}

      {tab === "history" ? (
        <Section title="Historial en este ejercicio">
          {history.length === 0 ? (
            <EmptyState title="Sin sesiones" message="Aparecera cuando lo uses en un entreno." />
          ) : (
            history.slice(0, 8).map((session) => (
              <View key={session.id} style={styles.historyRow}>
                <Text style={styles.historyTitle}>
                  {new Date(session.performedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.meta}>
                  {session.exercises.length} ejercicios · {session.status}
                </Text>
              </View>
            ))
          )}
        </Section>
      ) : null}

      {tab === "routine" ? (
        <Section title="Acciones rapidas">
          <View style={styles.suggestion}>
            <Text style={styles.suggestionTitle}>Planifica desde este ejercicio</Text>
            <Text style={styles.meta}>
              Crea una rutina base con 3 series y luego ajustala en el builder.
            </Text>
            <Button label="Crear rutina base" onPress={() => createRoutineFromExercise().catch(showError)} />
          </View>
        </Section>
      ) : null}
    </>
  );
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    ...shadow.card,
  },
  image: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 220,
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 10,
  },
  suggestion: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  suggestionTitle: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  suggestionSet: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  instruction: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  historyRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: 4,
    padding: 12,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
});
