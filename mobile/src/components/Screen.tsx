import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: 16,
    paddingBottom: 128,
    paddingTop: 12,
  },
});
