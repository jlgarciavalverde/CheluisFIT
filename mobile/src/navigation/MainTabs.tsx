import { Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FloatingBottomNav } from "../components/FloatingBottomNav";
import { TopHeader } from "../components/TopHeader";
import { ActiveWorkoutScreen } from "../screens/ActiveWorkoutScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useAuth } from "../auth/AuthProvider";
import { ExercisesStack } from "./ExercisesStack";
import { RoutinesStack } from "./RoutinesStack";
import type { MainTabsParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabsParamList>();

const tabTitles: Record<string, string> = {
  HistoryTab: "Resumen",
  ExercisesTab: "Ejercicios",
  ActiveWorkoutTab: "Entreno actual",
  RoutinesTab: "Rutinas",
  ProfileTab: "Perfil",
};

export function MainTabs() {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingBottomNav {...props} />}
      screenOptions={{
        header: ({ route }) => (
          <TopHeader
            title={tabTitles[route.name] ?? ""}
            onLogout={() =>
              Alert.alert("Cerrar sesion", "Seguro que quieres salir?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Salir", style: "destructive", onPress: () => logout() },
              ])
            }
          />
        ),
      }}
    >
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen name="ExercisesTab" component={ExercisesStack} />
      <Tab.Screen name="ActiveWorkoutTab" component={ActiveWorkoutScreen} />
      <Tab.Screen name="RoutinesTab" component={RoutinesStack} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
