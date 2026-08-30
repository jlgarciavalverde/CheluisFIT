import { Check, Plus } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutSession } from "../api/types";
import { colors, radius } from "../theme/tokens";
import { Button } from "./Button";
import { getSetTypeColor, SetTypeChip } from "./SetTypeChip";

type WorkoutExercise = WorkoutSession["exercises"][number];

export function ActiveWorkoutExerciseCard({
  workoutExercise,
  nextSetId,
  onAddSet,
  onCompleteSet,
  onEditSet,
}: {
  workoutExercise: WorkoutExercise;
  nextSetId: string | null;
  onAddSet: (workoutExercise: WorkoutExercise) => void;
  onCompleteSet: (setId: string, restSeconds: number) => void;
  onEditSet: (set: WorkoutExercise["sets"][number]) => void;
}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: workoutExercise.exercise.gifUrl }} style={styles.image} resizeMode="contain" />
      <View style={styles.header}>
        <Text style={styles.title}>{workoutExercise.exercise.name}</Text>
        <Text style={styles.meta}>
          {workoutExercise.exercise.targetMuscles.join(", ")} ·{" "}
          {workoutExercise.exercise.equipment.join(", ")}
        </Text>
      </View>
      <View style={styles.sets}>
        {workoutExercise.sets.map((set) => {
          const done = Boolean(set.completedAt);
          return (
            <View
              key={set.id}
              style={[
                styles.setPill,
                { borderColor: getSetTypeColor(set.type) },
                nextSetId === set.id && styles.nextSet,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => onEditSet(set)}
                style={[styles.setSummaryWrap, done && styles.done]}
              >
                <Text style={[styles.setSummary, { color: getSetTypeColor(set.type) }]}>
                  {set.weightKg}x{set.reps}
                </Text>
                <SetTypeChip type={set.type} compact />
              </Pressable>
              <Button
                icon={Check}
                label={done ? "OK" : "Hecha"}
                size="sm"
                variant={nextSetId === set.id ? "primary" : "ghost"}
                disabled={done}
                onPress={() => onCompleteSet(set.id, set.restSeconds)}
              />
            </View>
          );
        })}
      </View>
      <Button icon={Plus} label="Anadir serie" variant="secondary" onPress={() => onAddSet(workoutExercise)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  image: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 170,
    width: "100%",
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  sets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setPill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 38,
    padding: 6,
  },
  setSummaryWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 4,
  },
  done: {
    opacity: 0.55,
  },
  nextSet: {
    backgroundColor: `${colors.lime}12`,
  },
  setSummary: {
    fontSize: 13,
    fontWeight: "900",
  },
});
