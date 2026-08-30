import { ClipboardList, Dumbbell, History, User } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutSession } from "../api/types";
import { colors, radius, shadow } from "../theme/tokens";
import { ActiveWorkoutOrb } from "./ActiveWorkoutOrb";

type NavItem = {
  key: string;
  label: string;
};

const iconMap = {
  exercises: Dumbbell,
  history: History,
  profile: User,
  routines: ClipboardList,
} as const;

export function FloatingBottomNav({
  activeKey,
  items,
  session,
  secondsLeft,
  totalSeconds,
  onChange,
  onCenterPress,
}: {
  activeKey: string;
  items: NavItem[];
  session: WorkoutSession | null;
  secondsLeft: number;
  totalSeconds: number;
  onChange: (key: string) => void;
  onCenterPress: () => void;
}) {
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.bar}>
        <View style={styles.side}>{leftItems.map(renderItem)}</View>
        <ActiveWorkoutOrb
          session={session}
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          onPress={onCenterPress}
        />
        <View style={styles.side}>{rightItems.map(renderItem)}</View>
      </View>
    </View>
  );

  function renderItem(item: NavItem) {
    const active = item.key === activeKey;
    const Icon = iconMap[item.key as keyof typeof iconMap];
    const color = active ? colors.lime : colors.muted;

    return (
      <Pressable
        accessibilityRole="button"
        key={item.key}
        onPress={() => onChange(item.key)}
        style={[styles.item, active && styles.activeItem]}
      >
        {Icon ? <Icon color={color} size={18} strokeWidth={2.6} /> : null}
        <Text style={[styles.itemText, active && styles.activeText]}>{item.label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 18,
    left: 12,
    position: "absolute",
    right: 12,
  },
  bar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 72,
    paddingHorizontal: 10,
    ...shadow.card,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  item: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 4,
  },
  activeItem: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  itemText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  activeText: {
    color: colors.lime,
  },
});
