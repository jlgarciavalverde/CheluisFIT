import { ClipboardList, Dumbbell, History, User } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useWorkout } from "../contexts/WorkoutContext";
import { colors, radius, shadow } from "../theme/tokens";
import { ActiveWorkoutOrb } from "./ActiveWorkoutOrb";

const tabMeta: Record<string, { label: string; Icon: typeof History }> = {
  HistoryTab: { label: "Historial", Icon: History },
  ExercisesTab: { label: "Ejercicios", Icon: Dumbbell },
  RoutinesTab: { label: "Rutinas", Icon: ClipboardList },
  ProfileTab: { label: "Perfil", Icon: User },
};

export function FloatingBottomNav({ state, navigation }: BottomTabBarProps) {
  const { activeSession, restLeft, restTotal } = useWorkout();

  const visibleRoutes = state.routes.filter((r) => r.name !== "ActiveWorkoutTab");
  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.bar}>
        <View style={styles.side}>{leftRoutes.map(renderItem)}</View>
        <ActiveWorkoutOrb
          session={activeSession}
          secondsLeft={restLeft}
          totalSeconds={restTotal}
          onPress={() => navigation.navigate("ActiveWorkoutTab")}
        />
        <View style={styles.side}>{rightRoutes.map(renderItem)}</View>
      </View>
    </View>
  );

  function renderItem(route: (typeof state.routes)[number]) {
    const meta = tabMeta[route.name];
    if (!meta) return null;

    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const active = state.index === routeIndex;
    const color = active ? colors.lime : colors.muted;

    return (
      <Pressable
        accessibilityRole="button"
        key={route.key}
        onPress={() => navigation.navigate(route.name)}
        style={[styles.item, active && styles.activeItem]}
      >
        <meta.Icon color={color} size={18} strokeWidth={2.6} />
        <Text style={[styles.itemText, active && styles.activeText]}>{meta.label}</Text>
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
    minHeight: 74,
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
    minHeight: 46,
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
