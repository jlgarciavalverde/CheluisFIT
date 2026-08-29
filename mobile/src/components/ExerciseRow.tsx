import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "../api/types";
import { colors, radius } from "../theme/tokens";

export function ExerciseRow({
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
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.selected]}>
      <View style={styles.marker} />
      <View style={styles.copy}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {exercise.targetMuscles.join(", ") || "Sin musculo"} ·{" "}
          {exercise.equipment.join(", ") || "sin equipo"}
        </Text>
        {badges.length > 0 ? (
          <View style={styles.badges}>
            {badges.map((badge) => (
              <Text key={badge} style={styles.badge}>
                {badge}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 64,
    padding: 12,
  },
  selected: {
    borderColor: colors.lime,
  },
  marker: {
    backgroundColor: colors.lime,
    borderRadius: 3,
    height: 32,
    width: 4,
  },
  copy: {
    flex: 1,
    gap: 3,
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
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.lime,
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
