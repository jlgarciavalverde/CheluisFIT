import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ToastProvider } from "./src/contexts/ToastContext";
import { WorkoutProvider } from "./src/contexts/WorkoutContext";
import { EmptyState } from "./src/components/EmptyState";
import { MainTabs } from "./src/navigation/MainTabs";
import { AuthScreen } from "./src/screens/AuthScreen";
import { colors } from "./src/theme/tokens";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.lime,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
  },
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const { booting, user } = useAuth();

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
    <NavigationContainer theme={navTheme}>
      <WorkoutProvider>
        <ToastProvider>
          <SafeAreaView style={styles.app}>
            <MainTabs />
          </SafeAreaView>
        </ToastProvider>
      </WorkoutProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
