import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DashboardData, WorkoutSession } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { effectiveSets, totalVolume } from "../utils/workout";
import { BottomSheet } from "../components/BottomSheet";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MetricTile } from "../components/MetricTile";
import { ProgressChart } from "../components/ProgressChart";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { getSetTypeColor, SetTypeChip } from "../components/SetTypeChip";
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

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
  const trend = dashboard?.bodyWeightTrend ?? [];
  const currentWeight = (trend.length > 0 ? trend[trend.length - 1].weightKg : null) ?? 0;
  const workoutsThisWeek = dashboard?.workoutsThisWeek ?? 0;

  const currentWeight = useMemo(() => {
    const trend = dashboard?.bodyWeightTrend ?? [];
    if (!trend.length) return "0.0";
    return (trend.at(-1)?.weightKg ?? 0).toFixed(1);
  }, [dashboard]);

  const chartValues = (dashboard?.bodyWeightTrend ?? []).map((point) => point.weightKg);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.metricGrid}>
        <MetricTile label="Entrenos" value={workoutsThisWeek} />
        <MetricTile label="Volumen" value={`${Math.round(weeklyVolume)} kg`} />
        <MetricTile label="Peso" value={`${currentWeight.toFixed(1)} kg`} />
      </View>

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
          </View>
        </View>

      <Section title="Evolucion peso corporal">
        <View style={styles.chartPanel}>
          <ProgressChart
            values={(dashboard?.bodyWeightTrend ?? []).map((point) => point.weightKg)}
            labels={(dashboard?.bodyWeightTrend ?? []).map((point) =>
              point.measuredAt,
            )}
          />
        </View>
      </Section>

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
          <>
            <Text style={styles.sheetTitle}>
              {formatDate(selected.performedAt)}
            </Text>
            <Text style={styles.sheetMeta}>
              {selected.status === "COMPLETED" ? "Completado" : "En progreso"} · {Math.round(totalVolume(selected))} kg volumen
            </Text>

            {selected.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseBlock}>
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <Text style={styles.sheetMeta}>
                  {Math.round(
                    exercise.sets.reduce((total, set) => total + set.weightKg * set.reps, 0),
                  )}{" "}
                  kg · {exercise.sets.length} series
                </Text>
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
          </View>
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
  chartPanel: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 12,
    ...shadow.card,
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
