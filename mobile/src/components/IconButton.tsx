import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme/tokens";

export function IconButton({
  label,
  symbol,
  onPress,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.symbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  symbol: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
