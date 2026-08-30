import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "../api/types";
import { colors, radius, shadow } from "../theme/tokens";

export const ExerciseRow = memo(function ExerciseRow({
  exercise,
  onPress,
  badges = [],
  selected,
}: {
  exercise: Exercise;
  onPress: () => void;
  badges?: string[];
  selected?: boolean;
}) {
  const visibleBadges = badges.slice(0, 2);

  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.selected]}>
      <View style={[styles.marker, selected && styles.markerSelected]} />
      <View style={styles.copy}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {exercise.targetMuscles.join(", ") || "Sin musculo"} ·{" "}
          {exercise.equipment.join(", ") || "sin equipo"}
        </Text>

        {visibleBadges.length > 0 ? (
          <View style={styles.badges}>
            {visibleBadges.map((badge) => (
              <Text key={badge} style={styles.badge}>
                {badge}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadow.card,
  },
  selected: {
    borderColor: colors.lime,
    backgroundColor: colors.surface,
  },
  marker: {
    backgroundColor: colors.borderStrong,
    borderRadius: 999,
    height: 32,
    width: 4,
  },
  markerSelected: {
    backgroundColor: colors.lime,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.lime,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textTransform: "uppercase",
  },
});
