import { Alert, Image, StyleSheet, Text, View } from "react-native";
import type { Exercise, ProgressionSuggestion, ProgressPoint, WorkoutSession } from "../api/types";
import type { ApiFetch } from "../api/types";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ProgressChart } from "../components/ProgressChart";
import { Section } from "../components/Section";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { StatStrip } from "../components/StatStrip";
import { colors, radius } from "../theme/tokens";

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
  setMessage: (value: string) => void;
}) {
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
        <Image source={{ uri: exercise.gifUrl }} style={styles.image} resizeMode="contain" />

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.metaLabel}>Músculo principal</Text>
            <Text style={styles.metaValue}>{exercise.targetMuscles.join(", ") || "Sin musculo"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.metaLabel}>Secundario</Text>
            <Text style={styles.metaValue}>{exercise.secondaryMuscles.join(", ") || "No especificado"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.metaLabel}>Equipo</Text>
            <Text style={styles.metaValue}>{exercise.equipment.join(", ") || "Sin equipo"}</Text>
          </View>
          {exercise.bodyParts?.length ? (
            <View style={styles.infoCard}>
              <Text style={styles.metaLabel}>Zona</Text>
              <Text style={styles.metaValue}>{exercise.bodyParts.join(", ")}</Text>
            </View>
          ) : null}
        </View>

        <StatStrip
          items={[
            { label: "PR", value: `${lastProgress?.maxWeightKg ?? 0} kg` },
            { label: "Sesiones", value: history.length },
            { label: "Favorito", value: favorite ? "Si" : "No" },
          ]}
        />
        <View style={styles.actions}>
          <Button label="Volver" variant="ghost" onPress={onBack} />
          <Button
            variant="secondary"
            label={favorite ? "Quitar fav" : "Favorito"}
            onPress={onToggleFavorite}
          />
        </View>
        <Button
          label="Crear rutina"
          onPress={() => createRoutineFromExercise().catch(showError)}
        />
      </Section>

      <Section title="Progreso">
        <SegmentedTabs
          tabs={[
            { key: "weight", label: "Peso" },
            { key: "volume", label: "Volumen" },
          ]}
          value={metric}
          onChange={(key) => onMetricChange(key as "weight" | "volume")}
        />
        <ProgressChart values={chartValues} />
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

      <Section title="Instrucciones">
        {exercise.instructions.length === 0 ? (
          <EmptyState title="Sin instrucciones" />
        ) : (
          exercise.instructions.slice(0, 5).map((instruction, index) => (
            <Text key={`${instruction}-${index}`} style={styles.instruction}>
              {index + 1}. {instruction}
            </Text>
          ))
        )}
      </Section>

      <Section title="Historial en este ejercicio">
        {history.length === 0 ? (
          <EmptyState title="Sin sesiones" message="Aparecera cuando lo uses en un entreno." />
        ) : (
          history.slice(0, 6).map((session) => (
            <View key={session.id} style={styles.historyRow}>
              <Text style={styles.historyTitle}>{new Date(session.performedAt).toLocaleDateString()}</Text>
              <Text style={styles.meta}>
                {session.exercises.length} ejercicios · {session.status}
              </Text>
            </View>
          ))
        )}
      </Section>
    </>
  );
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 230,
    width: "100%",
  },
  infoGrid: {
    gap: 8,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: "900",
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
