import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import type { WorkoutSession } from "./src/api/types";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { EmptyState } from "./src/components/EmptyState";
import { FloatingBottomNav } from "./src/components/FloatingBottomNav";
import { Toast } from "./src/components/Toast";
import { TopHeader } from "./src/components/TopHeader";
import { ActiveWorkoutScreen } from "./src/screens/ActiveWorkoutScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ExercisesScreen } from "./src/screens/ExercisesScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RoutinesScreen } from "./src/screens/RoutinesScreen";
import { colors } from "./src/theme/tokens";

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

  const adjustRest = (seconds: number) => {
    setRestLeft((current) => Math.max(current + seconds, 0));
    setRestTotal((current) => Math.max(current + seconds, restLeft + seconds, 0));
  };

  const skipRest = () => {
    setRestLeft(0);
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.app}>
        <EmptyState title="Cargando sesion" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.app}>
      <TopHeader title={getTabTitle(tab)} onLogout={() => logout()} />
      <Toast message={message} onDone={() => setMessage("")} />

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
          restLeft={restLeft}
          restTotal={restTotal}
          onAdjustRest={adjustRest}
          onSkipRest={skipRest}
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

function getTabTitle(tab: AppTab) {
  const titles: Record<AppTab, string> = {
    activeWorkout: "Entreno actual",
    exercises: "Ejercicios",
    history: "Resumen",
    profile: "Perfil",
    routines: "Rutinas",
  };

  return titles[tab];
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
