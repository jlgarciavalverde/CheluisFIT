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
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
