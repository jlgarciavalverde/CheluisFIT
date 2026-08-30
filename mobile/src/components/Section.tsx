import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../theme/tokens";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  title: {
    color: colors.textSoft,
    fontSize: typography.section,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: "uppercase",
  },
});
