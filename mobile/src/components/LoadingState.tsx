import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  text: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});
