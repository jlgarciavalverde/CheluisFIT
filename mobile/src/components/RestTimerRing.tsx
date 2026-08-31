import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme/tokens";

const SIZE = 84;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function RestTimerRing({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number;
  totalSeconds: number;
}) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const strokeColor = progress > 0.5 ? colors.lime : progress > 0.2 ? colors.warning : colors.error;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={colors.surface3}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={strokeColor}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.inner}>
        <Text style={styles.value}>{formatSeconds(secondsLeft)}</Text>
        <Text style={styles.label}>descanso</Text>
      </View>
    </View>
  );
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: SIZE,
    justifyContent: "center",
    width: SIZE,
  },
  svg: {
    position: "absolute",
  },
  inner: {
    alignItems: "center",
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
