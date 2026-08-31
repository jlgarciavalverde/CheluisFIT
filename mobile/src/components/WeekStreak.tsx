import { StyleSheet, Text, View } from "react-native";
import { colors, radius, withOpacity } from "../theme/tokens";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export function WeekStreak({ workoutDates }: { workoutDates: string[] }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const workoutDays = new Set(
    workoutDates.map((d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }),
  );

  const days = DAY_LABELS.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const hasWorkout = workoutDays.has(key);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    return { label, hasWorkout, isToday };
  });

  const streak = days.filter((d) => d.hasWorkout).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Racha semanal</Text>
        <Text style={styles.streakBadge}>{streak}/7</Text>
      </View>
      <View style={styles.row}>
        {days.map((day) => (
          <View key={day.label} style={styles.dayCol}>
            <View
              style={[
                styles.dot,
                day.hasWorkout && styles.dotActive,
                day.isToday && styles.dotToday,
              ]}
            />
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  streakBadge: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  dot: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    width: 24,
  },
  dotActive: {
    backgroundColor: withOpacity(colors.lime, 0.15),
    borderColor: colors.lime,
  },
  dotToday: {
    borderColor: colors.borderStrong,
    borderWidth: 2.5,
  },
  dayLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dayLabelToday: {
    color: colors.textSoft,
  },
});
