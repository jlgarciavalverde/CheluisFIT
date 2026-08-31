import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, radius, withOpacity } from "../theme/tokens";

export function LoadingState({ title = "Cargando" }: { title?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.lime} />
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    minHeight: 124,
    justifyContent: "center",
    padding: 18,
  },
  text: {
    color: withOpacity(colors.textSoft, 0.86),
    fontSize: 13,
    fontWeight: "800",
  },
});
