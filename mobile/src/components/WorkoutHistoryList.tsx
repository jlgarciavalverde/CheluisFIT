import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutSession } from "../api/types";
import { colors, radius } from "../theme/tokens";
import { EmptyState } from "./EmptyState";
import { StatStrip } from "./StatStrip";

export function WorkoutHistoryList({
  sessions,
  onSelect,
}: {
  sessions: WorkoutSession[];
  onSelect?: (session: WorkoutSession) => void;
}) {
  if (sessions.length === 0) {
    return <EmptyState title="Sin historial" message="Cuando completes entrenos apareceran aqui." />;
  }

  return (
    <View style={styles.list}>
      {sessions.map((session) => {
        const setCount = session.exercises.reduce(
          (total, exercise) => total + exercise.sets.length,
          0,
        );
        const volumeKg = session.exercises.reduce(
          (sessionTotal, exercise) =>
            sessionTotal +
            exercise.sets.reduce((setTotal, set) => setTotal + set.weightKg * set.reps, 0),
          0,
        );
        const topMuscles = session.muscleSummary
          .slice(0, 2)
          .map((point) => `${point.muscle} ${point.effectiveSets}`)
          .join(" · ");

        return (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            onPress={() => onSelect?.(session)}
            style={styles.card}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{formatDate(session.performedAt)}</Text>
              <Text style={[styles.badge, session.status === "COMPLETED" && styles.badgeDone]}>
                {session.status === "COMPLETED" ? "OK" : "Act"}
              </Text>
            </View>

            <Text style={styles.meta} numberOfLines={1}>
              {session.exercises.map((exercise) => exercise.exercise.name).slice(0, 2).join(" · ")}
            </Text>

            <View style={styles.inlineStats}>
              <Text style={styles.statValue}>{Math.round(volumeKg)} kg</Text>
              <Text style={styles.divider}>·</Text>
              <Text style={styles.statValue}>{setCount} series</Text>
              <Text style={styles.divider}>·</Text>
              <Text style={styles.statValue}>{formatSessionDuration(session)}</Text>
            </View>

            {topMuscles ? <Text style={styles.muscles}>{topMuscles}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function formatSessionDuration(session: WorkoutSession) {
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const start = new Date(session.startedAt).getTime();
  const minutes = Math.max(Math.round((end - start) / 60000), 0);
  return `${minutes}m`;
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  badge: {
    backgroundColor: `${colors.cyan}1A`,
    borderColor: colors.cyan,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  badgeDone: {
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
    color: colors.lime,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  inlineStats: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  statValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  divider: {
    color: colors.muted,
    fontSize: 12,
  },
  muscles: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
});
