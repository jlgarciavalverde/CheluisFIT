import { Plus, Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { showError } from "../utils/errors";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { ProgressionSuggestion, ProgressPoint, WorkoutSession } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { ProgressChart } from "../components/ProgressChart";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { StatStrip } from "../components/StatStrip";
import type { ExercisesStackParamList } from "../navigation/types";
import { colors, radius, shadow } from "../theme/tokens";

type RouteProps = NativeStackScreenProps<ExercisesStackParamList, "ExerciseDetail">["route"];

export function ExerciseDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<ExercisesStackParamList>>();
  const { apiFetch } = useAuth();
  const showToast = useToast();
  const { exercise } = route.params;

  const [tab, setTab] = useState<"info" | "progress" | "history" | "routine">("progress");
  const [metric, setMetric] = useState<"weight" | "volume">("weight");
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [progression, setProgression] = useState<ProgressionSuggestion | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [progressResult, progressionResult, statesResult, sessionsResult] = await Promise.all([
        apiFetch<{ data: ProgressPoint[] }>(`/exercises/${exercise.id}/progress`),
        apiFetch<{ data: ProgressionSuggestion }>(`/exercises/${exercise.id}/progression`),
        apiFetch<{ data: Array<{ exerciseId: string; isFavorite: boolean }> }>(
          `/me/exercise-states?exerciseIds=${exercise.id}`,
        ),
        apiFetch<{ data: WorkoutSession[] }>("/me/workout-sessions?limit=50"),
      ]);
      setProgress(progressResult.data);
      setProgression(progressionResult.data);
      setFavorite(statesResult.data.find((s) => s.exerciseId === exercise.id)?.isFavorite ?? false);
      setHistory(
        sessionsResult.data.filter((s) => s.exercises.some((e) => e.exerciseId === exercise.id)),
      );
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, exercise.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFavorite = async () => {
    try {
      if (favorite) {
        await apiFetch(`/favorite-exercises/${exercise.id}`, { method: "DELETE" });
        setFavorite(false);
        showToast("Favorito eliminado");
      } else {
        await apiFetch("/favorite-exercises", {
          method: "POST",
          body: JSON.stringify({ exerciseId: exercise.id }),
        });
        setFavorite(true);
        showToast("Favorito guardado");
      }
    } catch (error) {
      showError(error);
    }
  };

  const addToActiveWorkout = async () => {
    try {
      const active = await apiFetch<{ data: WorkoutSession | null }>("/workout-sessions/active");
      if (!active.data) {
        showToast("Empieza una rutina antes de anadir ejercicios");
        return;
      }
      await apiFetch(`/workout-sessions/${active.data.id}/exercises`, {
        method: "POST",
        body: JSON.stringify({
          exerciseId: exercise.id,
          sets: [{ weightKg: 0, reps: 10, type: "NORMAL", restSeconds: 90 }],
        }),
      });
      showToast("Ejercicio anadido al entreno");
    } catch (error) {
      showError(error);
    }
  };

  const createRoutineFromExercise = async () => {
    try {
      const lastProgress = progress[progress.length - 1];
      await apiFetch("/workout-templates", {
        method: "POST",
        body: JSON.stringify({
          name: `${exercise.name} base`,
          exercises: [
            {
              exerciseId: exercise.id,
              sets: [
                {
                  targetWeightKg: lastProgress?.maxWeightKg ?? 0,
                  targetReps: 10,
                  type: "NORMAL",
                  restSeconds: 90,
                },
                {
                  targetWeightKg: lastProgress?.maxWeightKg ?? 0,
                  targetReps: 10,
                  type: "NORMAL",
                  restSeconds: 90,
                },
                {
                  targetWeightKg: lastProgress?.maxWeightKg ?? 0,
                  targetReps: 10,
                  type: "NORMAL",
                  restSeconds: 90,
                },
              ],
            },
          ],
        }),
      });
      showToast("Rutina creada desde ejercicio");
    } catch (error) {
      showError(error);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Cargando ejercicio" />
      </Screen>
    );
  }

  const chartValues =
    metric === "weight"
      ? progress.map((point) => point.maxWeightKg)
      : progress.map((point) => point.totalVolumeKg);
  const lastProgress = progress[progress.length - 1];

  return (
    <Screen>
      <Section title={exercise.name}>
        <View style={styles.summaryCard}>
          <Image source={exercise.gifUrl} style={styles.image} contentFit="contain" />
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
            <Button label="Volver" variant="ghost" onPress={() => navigation.goBack()} />
            <Button
              icon={Star}
              variant="secondary"
              label={favorite ? "Quitar fav" : "Favorito"}
              onPress={toggleFavorite}
            />
          </View>
          <View style={styles.actions}>
            <Button icon={Plus} label="Anadir al entreno" onPress={addToActiveWorkout} />
            <Button label="Crear rutina" variant="secondary" onPress={createRoutineFromExercise} />
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
            onChange={(key) => setMetric(key as "weight" | "volume")}
          />
          <View style={styles.chartCard}>
            <ProgressChart
              values={chartValues}
              labels={progress.map((point) => point.performedAt)}
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
                  {formatDate(session.performedAt)}
                </Text>
                <Text style={styles.meta}>
                  {session.exercises.length} ejercicios · {session.status === "COMPLETED" ? "Completado" : "En progreso"}
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
            <Button label="Crear rutina base" onPress={createRoutineFromExercise} />
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
