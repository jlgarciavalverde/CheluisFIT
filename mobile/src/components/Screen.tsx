import type { ReactNode } from "react";
import { Keyboard, RefreshControl, ScrollView, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";

type Props = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({ children, refreshing, onRefresh }: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={Keyboard.dismiss}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={colors.lime}
            colors={[colors.lime]}
          />
        ) : undefined
      }
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
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 128,
    paddingTop: 12,
  },
});
