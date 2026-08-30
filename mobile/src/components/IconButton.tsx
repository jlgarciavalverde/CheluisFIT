import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, opacity, radius } from "../theme/tokens";

export function IconButton({
  label,
  icon: Icon,
  symbol,
  onPress,
}: {
  label: string;
  icon?: LucideIcon;
  symbol?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {Icon ? <Icon color={colors.text} size={18} strokeWidth={2.7} /> : <Text style={styles.symbol}>{symbol}</Text>}
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
  pressed: {
    opacity: opacity.pressed,
  },
  symbol: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
