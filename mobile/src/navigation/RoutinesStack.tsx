import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RoutineBuilderScreen } from "../screens/RoutineBuilderScreen";
import { RoutinesScreen } from "../screens/RoutinesScreen";
import type { RoutinesStackParamList } from "./types";

const Stack = createNativeStackNavigator<RoutinesStackParamList>();

export function RoutinesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutinesList" component={RoutinesScreen} />
      <Stack.Screen name="RoutineBuilder" component={RoutineBuilderScreen} />
    </Stack.Navigator>
  );
}
