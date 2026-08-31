import { StyleSheet, Text } from "react-native";
import { colors, withOpacity } from "../theme/tokens";

export function MuscleChip({ label, type }: { label: string; type: "primary" | "secondary" }) {
  const isPrimary = type === "primary";

  return (
    <Text
      style={[
        styles.chip,
        {
          backgroundColor: withOpacity(isPrimary ? colors.lime : colors.cyan, 0.08),
          borderColor: withOpacity(isPrimary ? colors.lime : colors.cyan, 0.4),
          color: isPrimary ? colors.lime : colors.cyan,
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textTransform: "capitalize",
  },
});
