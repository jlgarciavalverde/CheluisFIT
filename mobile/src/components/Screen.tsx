import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";

export function Screen({ children }: { children: ReactNode }) {
  return <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    gap: 16,
    padding: 16,
    paddingBottom: 128,
  },
});
