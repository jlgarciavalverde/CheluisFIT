import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dumbbell, Scale, Target } from "lucide-react-native";
import type { DashboardData, MuscleSummaryPoint, WorkoutSession } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { effectiveSets, totalVolume } from "../utils/workout";
import { BottomSheet } from "../components/BottomSheet";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MetricTile } from "../components/MetricTile";
import { MiniSparkline } from "../components/MiniSparkline";
import { MuscleMap } from "../components/MuscleMap";
import { ProgressChart } from "../components/ProgressChart";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { getSetTypeColor, SetTypeChip } from "../components/SetTypeChip";
import { WeekStreak } from "../components/WeekStreak";
import { WorkoutHistoryList } from "../components/WorkoutHistoryList";
import { colors, radius, shadow } from "../theme/tokens";

export function HistoryScreen() {
  const { apiFetch } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResult, sessionsResult] = await Promise.all([
        apiFetch<{ data: DashboardData }>("/me/dashboard"),
        apiFetch<{ data: WorkoutSession[] }>("/me/workout-sessions?limit=20"),
      ]);
      setDashboard(dashboardResult.data);
      setSessions(sessionsResult.data);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const thisWeekSessions = useMemo(
    () => sessions.filter((session) => isThisWeek(session.performedAt)),
    [sessions],
  );
  const weeklyVolume = useMemo(
    () => thisWeekSessions.reduce((total, session) => total + totalVolume(session), 0),
    [thisWeekSessions],
  );
  const weeklySets = useMemo(
    () => thisWeekSessions.reduce((total, session) => total + effectiveSets(session), 0),
    [thisWeekSessions],
  );
  const trend = useMemo(() => dashboard?.bodyWeightTrend ?? [], [dashboard?.bodyWeightTrend]);
  const trendValues = useMemo(() => trend.map((p) => p.weightKg), [trend]);
  const durationTrend = useMemo(
    () =>
      (dashboard?.recentWorkouts ?? [])
        .slice()
        .reverse()
        .filter((workout) => workout.durationMinutes !== null)
        .map((workout) => ({
          label: workout.performedAt,
          value: workout.durationMinutes ?? 0,
        })),
    [dashboard?.recentWorkouts],
  );
  const currentWeight = (trend.length > 0 ? trend[trend.length - 1].weightKg : null) ?? 0;
  const workoutsThisWeek = dashboard?.workoutsThisWeek ?? 0;
  const recentWeightDelta = useMemo(() => {
    if (trend.length < 2) return 0;
    return (trend[trend.length - 1].weightKg ?? 0) - (trend[0].weightKg ?? 0);
  }, [trend]);
  const weeklyConsistency = workoutsThisWeek
    ? Math.min(100, Math.round((workoutsThisWeek / 5) * 100))
    : 0;

  const weightTrend: "up" | "down" | "neutral" =
    recentWeightDelta > 0.3 ? "up" : recentWeightDelta < -0.3 ? "down" : "neutral";

  const workoutDates = useMemo(() => sessions.map((s) => s.performedAt), [sessions]);

  if (loading && !refreshing) {
    return (
      <Screen>
        <LoadingState title="Cargando historial" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState title="No se pudo cargar" message={error} onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.metricGrid}>
        <MetricTile
          label="Entrenos"
          value={workoutsThisWeek}
          icon={Dumbbell}
          subtitle="esta semana"
        />
        <MetricTile
          label="Consistencia"
          value={`${weeklyConsistency}%`}
          icon={Target}
          accentColor={weeklyConsistency >= 80 ? colors.lime : undefined}
        />
        <MetricTile
          label="Peso"
          value={`${currentWeight.toFixed(1)}`}
          icon={Scale}
          trend={weightTrend}
          subtitle="kg"
        />
      </View>

      <WeekStreak workoutDates={workoutDates} />

      <Section title="Resumen semanal">
        <View style={styles.summaryPanel}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{weeklySets}</Text>
            <Text style={styles.summaryLabel}>series efectivas</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{Math.round(weeklyVolume)}</Text>
            <Text style={styles.summaryLabel}>kg movidos</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{currentWeight.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>kg actuales</Text>
            {trendValues.length >= 2 ? (
              <View style={styles.sparkWrap}>
                <MiniSparkline values={trendValues} width={60} height={20} />
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.summaryFootnote}>
          {recentWeightDelta >= 0 ? "+" : ""}
          {recentWeightDelta.toFixed(1)} kg vs. inicio de la tendencia
        </Text>
      </Section>

      <Section title="Mapa muscular semanal">
        <MuscleMap summary={dashboard?.weeklyMuscleSummary ?? []} size="lg" showLegend />
      </Section>

      <Section title="Evolucion peso corporal">
        <ProgressChart values={trendValues} labels={trend.map((point) => point.measuredAt)} />
      </Section>

      <Section title="Duracion de entrenos">
        <ProgressChart
          values={durationTrend.map((point) => point.value)}
          labels={durationTrend.map((point) => point.label)}
        />
      </Section>

      <Section title="Historial de entrenos">
        <WorkoutHistoryList sessions={sessions} onSelect={setSelected} />
      </Section>

      <BottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <Text style={styles.sheetTitle}>{formatDate(selected.performedAt)}</Text>
            <Text style={styles.sheetMeta}>
              {selected.status === "COMPLETED" ? "Completado" : "En progreso"} ·{" "}
              {Math.round(totalVolume(selected))} kg volumen
            </Text>
            {selected.notes ? <Text style={styles.noteText}>{selected.notes}</Text> : null}
            <MuscleMap summary={selected.muscleSummary} size="md" showLegend />
            {selected.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseBlock}>
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <Text style={styles.sheetMeta}>
                  {Math.round(
                    exercise.sets.reduce((total, set) => total + set.weightKg * set.reps, 0),
                  )}{" "}
                  kg · {exercise.sets.length} series
                </Text>
                <MuscleMap summary={computeExerciseMuscleSummary(exercise)} size="sm" />
                <View style={styles.setWrap}>
                  {exercise.sets.map((set) => (
                    <View
                      key={set.id}
                      style={[styles.setPill, { borderColor: getSetTypeColor(set.type) }]}
                    >
                      <Text style={[styles.setText, { color: getSetTypeColor(set.type) }]}>
                        {set.weightKg}x{set.reps}
                      </Text>
                      <SetTypeChip type={set.type} compact />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function isThisWeek(value: string) {
  const date = new Date(value);
  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return date >= weekStart && date <= now;
}

function computeExerciseMuscleSummary(
  workoutExercise: WorkoutSession["exercises"][number],
): MuscleSummaryPoint[] {
  const effectiveSetCount = workoutExercise.sets.filter((set) => set.type !== "WARMUP").length;
  const summary = new Map<string, MuscleSummaryPoint>();

  for (const muscle of workoutExercise.exercise.targetMuscles) {
    addMuscleSets(summary, muscle, effectiveSetCount);
  }

  for (const muscle of workoutExercise.exercise.secondaryMuscles) {
    addMuscleSets(summary, muscle, effectiveSetCount * 0.5);
  }

  return Array.from(summary.values()).sort((a, b) => b.effectiveSets - a.effectiveSets);
}

function addMuscleSets(summary: Map<string, MuscleSummaryPoint>, muscle: string, value: number) {
  const key = muscle.toLowerCase();
  const current = summary.get(key) ?? {
    muscle,
    effectiveSets: 0,
    recommendedMin: 4,
    recommendedMax: 6,
  };

  current.effectiveSets += value;
  summary.set(key, current);
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryPanel: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    ...shadow.card,
  },
  summaryRow: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  summaryDivider: {
    backgroundColor: colors.border,
    width: 1,
  },
  summaryFootnote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  sparkWrap: {
    marginTop: 4,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  sheetMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  noteText: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
  },
  exerciseBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  setWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setPill: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  setText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
