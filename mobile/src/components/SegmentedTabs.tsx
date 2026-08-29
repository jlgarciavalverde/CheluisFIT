import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

type Tab = {
  key: string;
  label: string;
};

export function SegmentedTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.sm,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  active: {
    backgroundColor: colors.lime,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  activeLabel: {
    color: colors.background,
  },
});
