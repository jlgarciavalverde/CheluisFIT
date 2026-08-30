import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>•</Text>
      </View>
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
    gap: 6,
    padding: 14,
  },
  badge: {
    alignItems: "center",
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  badgeText: {
    color: colors.lime,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 16,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
