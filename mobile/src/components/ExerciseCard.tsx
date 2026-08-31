import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Dumbbell, Heart } from "lucide-react-native";
import type { Exercise, ExerciseState } from "../api/types";
import { colors, radius, shadow, withOpacity } from "../theme/tokens";
import { MuscleChip } from "./MuscleChip";

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  state,
  onPress,
  selected,
}: {
  exercise: Exercise;
  state?: ExerciseState;
  onPress: () => void;
  selected?: boolean;
}) {
  const secondarySlice = exercise.secondaryMuscles.slice(0, 2);
  const equipmentLabel = exercise.equipment.join(", ") || "sin equipo";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: exercise.gifUrl }}
        style={styles.thumb}
        contentFit="cover"
        recyclingKey={exercise.id}
      />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>

        <View style={styles.chips}>
          {exercise.targetMuscles.map((muscle) => (
            <MuscleChip key={muscle} label={muscle} type="primary" />
          ))}
          {secondarySlice.map((muscle) => (
            <MuscleChip key={muscle} label={muscle} type="secondary" />
          ))}
        </View>

        <View style={styles.equipRow}>
          <Dumbbell size={12} color={colors.muted} />
          <Text style={styles.equip} numberOfLines={1}>
            {equipmentLabel}
          </Text>
        </View>
      </View>

      {state ? (
        <View style={styles.meta}>
          {state.isFavorite ? <Heart size={14} color={colors.lime} fill={colors.lime} /> : null}
          {state.sessionCount > 0 ? <Text style={styles.count}>{state.sessionCount}x</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
    ...shadow.card,
  },
  selected: {
    backgroundColor: withOpacity(colors.lime, 0.06),
    borderColor: colors.lime,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  thumb: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 52,
    width: 52,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  equipRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  equip: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  meta: {
    alignItems: "center",
    gap: 6,
  },
  count: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
});
