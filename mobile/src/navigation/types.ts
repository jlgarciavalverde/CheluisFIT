import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Exercise, WorkoutTemplate } from "../api/types";

export type ExercisesStackParamList = {
  ExercisesList: undefined;
  ExerciseDetail: { exercise: Exercise };
};

export type RoutinesStackParamList = {
  RoutinesList: undefined;
  RoutineBuilder: { template: WorkoutTemplate | null };
};

export type MainTabsParamList = {
  HistoryTab: undefined;
  ExercisesTab: NavigatorScreenParams<ExercisesStackParamList>;
  ActiveWorkoutTab: undefined;
  RoutinesTab: NavigatorScreenParams<RoutinesStackParamList>;
  ProfileTab: undefined;
};
