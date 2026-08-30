import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
      <Image source={{ uri: exercise.gifUrl }} resizeMode="contain" style={styles.image} />

      <View style={styles.copy}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{exercise.name}</Text>
          {badges.length > 0 ? (
            <View style={styles.badges}>
              {badges.slice(0, 2).map((badge) => (
                <Text key={badge} style={styles.badge}>
                  {badge}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Principal</Text>
          <Text style={styles.metaValue}>{exercise.targetMuscles.join(", ") || "Sin musculo"}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Secundario</Text>
          <Text style={styles.metaValue}>{exercise.secondaryMuscles.join(", ") || "No especificado"}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Equipo</Text>
          <Text style={styles.metaValue}>{exercise.equipment.join(", ") || "Sin equipo"}</Text>
        </View>

        {exercise.bodyParts?.length ? (
          <View style={styles.pillRow}>
            {exercise.bodyParts.slice(0, 2).map((part) => (
              <Text key={part} style={styles.pill}>
                {part}
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
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  selected: {
    borderColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  image: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 92,
    width: 92,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  metaRow: {
    gap: 2,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  pill: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.cyan,
    fontSize: 9,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.lime,
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
});
