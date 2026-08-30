import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutSession } from "../api/types";
import { colors } from "../theme/tokens";
import { RestTimerRing } from "./RestTimerRing";

export function ActiveWorkoutOrb({
  session,
  secondsLeft,
  totalSeconds,
  onPress,
}: {
  session: WorkoutSession | null;
  secondsLeft: number;
  totalSeconds: number;
  onPress: () => void;
}) {
  const currentExercise =
    session?.exercises.find((exercise) => exercise.sets.some((set) => !set.completedAt))?.exercise
      .name ?? "Entreno";
  const isResting = totalSeconds > 0 && secondsLeft > 0;
  const restDone = totalSeconds > 0 && secondsLeft === 0;
  const label = !session ? "Empezar" : restDone ? "Listo" : isResting ? "Descanso" : currentExercise;
  const badgeStyle = !session
    ? styles.badgeIdle
    : restDone
      ? styles.badgeReady
      : isResting
        ? styles.badgeRest
        : styles.badgeTraining;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.wrap}>
      <RestTimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      <View style={[styles.badge, badgeStyle]}>
        <Text numberOfLines={1} style={styles.text}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    bottom: 10,
    position: "relative",
    width: 92,
  },
  badge: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -8,
    maxWidth: 92,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeIdle: {
    borderColor: colors.border,
  },
  badgeTraining: {
    borderColor: colors.lime,
  },
  badgeRest: {
    borderColor: colors.cyan,
  },
  badgeReady: {
    borderColor: colors.error,
  },
  text: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "capitalize",
  },
});
