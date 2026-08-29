import { StyleSheet, Text, View } from "react-native";
import type { ExerciseSetType } from "../api/types";
import { radius, setTypeColors } from "../theme/tokens";

const setTypeStyles: Record<ExerciseSetType, { label: string; color: string }> = {
  NORMAL: { label: "Normal", color: setTypeColors.NORMAL },
  WARMUP: { label: "Warmup", color: setTypeColors.WARMUP },
  SUPERSET: { label: "Superset", color: setTypeColors.SUPERSET },
  DROPSET: { label: "Dropset", color: setTypeColors.DROPSET },
};

export function SetTypeChip({ type, compact }: { type: ExerciseSetType; compact?: boolean }) {
  const typeStyle = setTypeStyles[type];

  return (
    <View style={[styles.chip, { borderColor: typeStyle.color }]}>
      <Text style={[styles.text, { color: typeStyle.color }]}>
        {compact ? typeStyle.label.slice(0, 1) : typeStyle.label}
      </Text>
    </View>
  );
}

export function getSetTypeColor(type: ExerciseSetType) {
  return setTypeStyles[type].color;
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
  },
});
