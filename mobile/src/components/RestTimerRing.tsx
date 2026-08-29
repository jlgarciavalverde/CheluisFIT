import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";

export function RestTimerRing({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number;
  totalSeconds: number;
}) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const color = progress > 0.5 ? colors.lime : progress > 0.2 ? colors.warning : colors.error;

  return (
    <View style={[styles.ring, { borderColor: color }]}>
      <Text style={styles.value}>{formatSeconds(secondsLeft)}</Text>
      <Text style={styles.label}>rest</Text>
    </View>
  );
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 42,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
