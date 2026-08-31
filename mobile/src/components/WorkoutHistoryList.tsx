import { Pressable, StyleSheet, Text, View } from "react-native";
import { Clock } from "lucide-react-native";
import type { WorkoutSession } from "../api/types";
import { colors, radius, shadow, withOpacity } from "../theme/tokens";
import { EmptyState } from "./EmptyState";
import { MuscleChip } from "./MuscleChip";
import { StatStrip } from "./StatStrip";

export function WorkoutHistoryList({
  sessions,
  onSelect,
}: {
  sessions: WorkoutSession[];
  onSelect?: (session: WorkoutSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <EmptyState title="Sin historial" message="Cuando completes entrenos apareceran aqui." />
    );
  }
  const groups = groupByWeek(sessions);

  return (
    <View style={styles.list}>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.sessions.map((session) => {
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
            const topMuscles = session.muscleSummary.slice(0, 3);
            const isCompleted = session.status === "COMPLETED";
            const duration = formatSessionDuration(session);

            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                onPress={() => onSelect?.(session)}
                style={({ pressed }) => [
                  styles.card,
                  isCompleted ? styles.cardDone : styles.cardActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>{formatDate(session.performedAt)}</Text>
                  <View style={styles.headerRight}>
                    <View style={styles.durationRow}>
                      <Clock size={12} color={colors.muted} />
                      <Text style={styles.durationText}>{duration}</Text>
                    </View>
                    <View
                      style={[styles.badge, isCompleted ? styles.badgeDone : styles.badgeActive]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isCompleted ? styles.badgeTextDone : styles.badgeTextActive,
                        ]}
                      >
                        {isCompleted ? "Completado" : "Activo"}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.meta}>
                  {session.exercises
                    .map((exercise) => exercise.exercise.name)
                    .slice(0, 3)
                    .join(" · ")}
                </Text>

                <StatStrip
                  items={[
                    { label: "Volumen", value: `${Math.round(volumeKg)} kg` },
                    { label: "Series", value: setCount },
                    { label: "Ejercicios", value: session.exercises.length },
                  ]}
                />

                {topMuscles.length > 0 ? (
                  <View style={styles.focus}>
                    <Text style={styles.focusLabel}>Foco muscular</Text>
                    <View style={styles.chipRow}>
                      {topMuscles.map((point) => (
                        <MuscleChip
                          key={point.muscle}
                          label={`${point.muscle} ${point.effectiveSets}s`}
                          type={
                            point.effectiveSets >= point.recommendedMin ? "primary" : "secondary"
                          }
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function groupByWeek(sessions: WorkoutSession[]) {
  const groups = new Map<string, WorkoutSession[]>();

  for (const session of sessions) {
    const date = new Date(session.performedAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const title = `Semana ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    groups.set(title, [...(groups.get(title) ?? []), session]);
  }

  return [...groups.entries()].map(([title, groupedSessions]) => ({
    title,
    sessions: groupedSessions,
  }));
}

function formatDate(value: string) {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatSessionDuration(session: WorkoutSession) {
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const start = new Date(session.startedAt).getTime();
  const minutes = Math.max(Math.round((end - start) / 60000), 0);
  return `${minutes}m`;
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    ...shadow.card,
  },
  cardDone: {
    borderColor: colors.borderStrong,
  },
  cardActive: {
    borderColor: colors.cyan,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  durationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  durationText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDone: {
    backgroundColor: withOpacity(colors.lime, 0.1),
    borderColor: colors.lime,
  },
  badgeActive: {
    backgroundColor: withOpacity(colors.cyan, 0.1),
    borderColor: colors.cyan,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badgeTextDone: {
    color: colors.lime,
  },
  badgeTextActive: {
    color: colors.cyan,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  focus: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  focusLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
});
