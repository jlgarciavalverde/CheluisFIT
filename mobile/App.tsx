import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { WorkoutSession } from "./src/api/types";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { Button } from "./src/components/Button";
import { EmptyState } from "./src/components/EmptyState";
import { FloatingBottomNav } from "./src/components/FloatingBottomNav";
import { ActiveWorkoutScreen } from "./src/screens/ActiveWorkoutScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ExercisesScreen } from "./src/screens/ExercisesScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RoutinesScreen } from "./src/screens/RoutinesScreen";
import { colors, typography } from "./src/theme/tokens";

type AppTab = "history" | "exercises" | "routines" | "profile" | "activeWorkout";

const navItems = [
  { key: "history", label: "Historial" },
  { key: "exercises", label: "Ejercicios" },
  { key: "routines", label: "Rutinas" },
  { key: "profile", label: "Perfil" },
];

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { apiFetch, booting, logout, user } = useAuth();
  const [tab, setTab] = useState<AppTab>("history");
  const [message, setMessage] = useState("");
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [restLeft, setRestLeft] = useState(0);

  const loadActiveSession = useCallback(async () => {
    if (!user) return;
    const result = await apiFetch<{ data: WorkoutSession | null }>("/workout-sessions/active");
    setActiveSession(result.data);
  }, [apiFetch, user]);

  useEffect(() => {
    loadActiveSession().catch(() => undefined);
  }, [loadActiveSession]);

  useEffect(() => {
    if (restLeft <= 0) return;

    const timer = setInterval(() => {
      setRestLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [restLeft]);

  const startRest = (seconds: number) => {
    setRestTotal(seconds);
    setRestLeft(seconds);
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.app}>
        <EmptyState title="Cargando sesion" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.app}>
        <AuthScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.app}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CheluisFIT</Text>
          <Text numberOfLines={1} style={styles.title}>
            {tab === "activeWorkout" ? "Entreno actual" : `Hola, ${user.firstName}`}
          </Text>
        </View>
        <Button label="Salir" variant="ghost" onPress={() => logout()} />
      </View>

      {message ? (
        <View style={styles.message}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {tab === "history" ? <HistoryScreen /> : null}
      {tab === "exercises" ? <ExercisesScreen setMessage={setMessage} /> : null}
      {tab === "routines" ? (
        <RoutinesScreen onActiveChange={loadActiveSession} setMessage={setMessage} />
      ) : null}
      {tab === "profile" ? <ProfileScreen setMessage={setMessage} /> : null}
      {tab === "activeWorkout" ? (
        <ActiveWorkoutScreen
          session={activeSession}
          onActiveChange={loadActiveSession}
          onStartRest={startRest}
          setMessage={setMessage}
        />
      ) : null}

      <FloatingBottomNav
        activeKey={tab}
        items={navItems}
        session={activeSession}
        secondsLeft={restLeft}
        totalSeconds={restTotal}
        onChange={(key) => setTab(key as AppTab)}
        onCenterPress={() => setTab("activeWorkout")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerCopy: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
  },
  message: {
    backgroundColor: "rgba(163, 230, 53, 0.10)",
    borderBottomWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.30)",
    borderTopWidth: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  messageText: {
    color: colors.lime,
    fontSize: 13,
    fontWeight: "800",
  },
});
