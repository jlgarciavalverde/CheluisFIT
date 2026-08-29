import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  message: {
    color: colors.muted,
    fontSize: 13,
  },
});
