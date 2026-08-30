import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ExerciseDetailScreen } from "../screens/ExerciseDetailScreen";
import { ExercisesScreen } from "../screens/ExercisesScreen";
import type { ExercisesStackParamList } from "./types";

const Stack = createNativeStackNavigator<ExercisesStackParamList>();

export function ExercisesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExercisesList" component={ExercisesScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    </Stack.Navigator>
  );
}
