import { StyleSheet, Text, View } from "react-native";
import { Info } from "lucide-react-native";
import { colors, radius, withOpacity } from "../theme/tokens";

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.iconWrap}>
        <Info size={16} color={colors.cyan} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.cyan, 0.08),
    borderColor: withOpacity(colors.cyan, 0.35),
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  copy: {
    flex: 1,
    gap: 3,
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
