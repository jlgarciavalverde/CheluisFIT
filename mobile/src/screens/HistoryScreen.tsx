import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DashboardData, WorkoutSession } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { BottomSheet } from "../components/BottomSheet";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MetricTile } from "../components/MetricTile";
import { ProgressChart } from "../components/ProgressChart";
import { Screen } from "../components/Screen";
import { WorkoutHistoryList } from "../components/WorkoutHistoryList";
import { colors, radius, shadow, typography } from "../theme/tokens";

export function HistoryScreen() {
  const { apiFetch } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResult, sessionsResult] = await Promise.all([
        apiFetch<{ data: DashboardData | null }>("/me/dashboard"),
        apiFetch<{ data: WorkoutSession[] | null }>("/me/workout-sessions?limit=20"),
      ]);
      setDashboard(dashboardResult?.data ?? null);
      setSessions(sessionsResult?.data ?? []);
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

  if (loading) {
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

  const weeklyVolume = sessions
    .filter((session) => isThisWeek(session.performedAt))
    .reduce((total, session) => total + totalVolume(session), 0);

  const weeklySets = sessions
    .filter((session) => isThisWeek(session.performedAt))
    .reduce((total, session) => total + effectiveSets(session), 0);

  const currentWeight = useMemo(() => {
    const trend = dashboard?.bodyWeightTrend ?? [];
    if (!trend.length) return "0.0";
    return (trend.at(-1)?.weightKg ?? 0).toFixed(1);
  }, [dashboard]);

  const chartValues = (dashboard?.bodyWeightTrend ?? []).map((point) => point.weightKg);

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={[styles.headerCard, shadow.floating]}>
          <Text style={styles.eyebrow}>Historial</Text>
          <Text style={styles.title}>Tu progreso</Text>
        </View>

        <View style={styles.metricGrid}>
          <MetricTile label="Entrenos" value={dashboard?.workoutsThisWeek ?? 0} />
          <MetricTile label="Sesiones" value={sessions.length} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Resumen semanal</Text>
          <View style={styles.summaryGrid}>
            <Text style={styles.summaryText}>{Math.round(weeklyVolume)} kg</Text>
            <Text style={styles.summaryText}>{weeklySets} series</Text>
            <Text style={styles.summaryText}>{currentWeight} kg</Text>
          </View>
        </View>

        {chartValues.length > 0 ? (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Peso corporal</Text>
            <ProgressChart values={chartValues} />
          </View>
        ) : (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Peso corporal</Text>
            <Text style={styles.emptyChartText}>Todavía no hay mediciones suficientes para mostrar tendencia.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Últimas sesiones</Text>
          {sessions.length === 0 ? (
            <EmptyState title="Sin historial" message="Completa entrenos y aparecerán aquí tus métricas semanales." />
          ) : (
            <WorkoutHistoryList sessions={sessions} onSelect={setSelected} />
          )}
        </View>
      </View>

      <BottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{new Date(selected.performedAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}</Text>
            <Text style={styles.sheetMeta}>
              {selected.status === "COMPLETED" ? "Completado" : "En progreso"} · {Math.round(totalVolume(selected))} kg volumen
            </Text>

            {selected.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseBlock}>
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <Text style={styles.sheetMeta}>
                  {exercise.sets.map((set) => `${set.weightKg}x${set.reps}`).join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
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

function effectiveSets(session: WorkoutSession) {
  return session.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal + exercise.sets.filter((set) => set.type !== "WARMUP").length,
    0,
  );
}

function isThisWeek(value: string) {
  const date = new Date(value);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return date >= weekAgo && date <= now;
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  emptyChartText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetContent: {
    gap: 10,
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
  exerciseBlock: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
  },
});
