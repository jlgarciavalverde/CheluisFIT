export type AuthUser = {
  id: string;
  firstName: string;
  lastName1: string;
  lastName2?: string | null;
  birthDate: string;
  email: string;
  currentWeightKg: number;
  currentHeightCm: number;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  birthDate: string;
  currentWeightKg: number;
  currentHeightCm: number;
  email: string;
  password: string;
};

export type Exercise = {
  id: string;
  externalId: string;
  source: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  instructions: string[];
  tips: string[];
};

export type ExerciseFacetOption = {
  value: string;
  count: number;
};

export type ExerciseFacets = {
  targetMuscles: ExerciseFacetOption[];
  secondaryMuscles: ExerciseFacetOption[];
  bodyParts: ExerciseFacetOption[];
  equipment: ExerciseFacetOption[];
};

export type ExerciseState = {
  exerciseId: string;
  isFavorite: boolean;
  usedRecently: boolean;
  inRoutine: boolean;
  lastUsedAt: string | null;
  sessionCount: number;
  routineCount: number;
};

export type ProgressPoint = {
  performedAt: string;
  sessionId: string;
  maxWeightKg: number;
  maxRepsAtMaxWeight: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
};

export type ExerciseRecordSummary = {
  userId: string;
  exerciseId: string;
  bestWeight: {
    weightKg: number;
    reps: number;
    performedAt: string;
    sessionId: string;
  } | null;
  bestVolume: {
    volumeKg: number;
    performedAt: string;
    sessionId: string;
  } | null;
  lastEntry: ProgressPoint | null;
};

export type ExerciseSetType = "NORMAL" | "WARMUP" | "SUPERSET" | "DROPSET";

export type WorkoutSessionStatus = "IN_PROGRESS" | "COMPLETED";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  type: ExerciseSetType;
  restSeconds: number;
  completedAt: string | null;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  performedAt: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  exercises: Array<{
    id: string;
    exerciseId: string;
    order: number;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
      gifUrl: string;
      targetMuscles: string[];
      secondaryMuscles: string[];
      bodyParts: string[];
      equipment: string[];
    };
    sets: WorkoutSet[];
  }>;
  muscleSummary: MuscleSummaryPoint[];
};

export type MuscleSummaryPoint = {
  muscle: string;
  effectiveSets: number;
  recommendedMin: number;
  recommendedMax: number;
};

export type ProgressionSuggestion = {
  status: "NO_HISTORY" | "INCREASE_LOAD" | "INCREASE_REPS";
  lastPerformedAt?: string;
  current?: {
    maxWeightKg: number;
    totalSets: number;
    targetReps: number;
  };
  suggestion: null | {
    incrementKg: number;
    sets: Array<{
      setNumber: number;
      weightKg: number;
      reps: number;
      type: ExerciseSetType;
      restSeconds: number;
    }>;
  };
  message: string;
};

export type DashboardData = {
  workoutsThisWeek: number;
  weeklyMuscleSummary: MuscleSummaryPoint[];
  recentWorkouts: Array<{
    id: string;
    performedAt: string;
    durationMinutes: number | null;
    exerciseCount: number;
    totalSets: number;
    totalVolumeKg: number;
  }>;
  mostWorkedExercises: Array<{
    exerciseId: string;
    name: string;
    sessionCount: number;
    totalSets: number;
    totalVolumeKg: number;
    lastPerformedAt: string;
  }>;
  bodyWeightTrend: Array<{
    measuredAt: string;
    weightKg: number;
    heightCm: number;
  }>;
};

export type ExercisePicks = {
  favorites: Exercise[];
  recent: Exercise[];
};

export type BodyMeasurement = {
  id: string;
  userId: string;
  weightKg: number;
  heightCm: number;
  measuredAt: string;
};

export type TrainingGoal = "HYPERTROPHY" | "STRENGTH" | "FAT_LOSS" | "GENERAL_FITNESS";

export type MeasurementUnits = "METRIC";

export type TrainingPreference = {
  id: string;
  userId: string;
  defaultRestSeconds: number;
  weeklyFrequency: number;
  goal: TrainingGoal;
  units: MeasurementUnits;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  notes: string | null;
  exercises: Array<{
    id: string;
    exerciseId: string;
    exercise: {
      id: string;
      name: string;
      gifUrl?: string;
      targetMuscles: string[];
      secondaryMuscles?: string[];
      bodyParts?: string[];
      equipment: string[];
    };
    sets: Array<{
      id?: string;
      setNumber: number;
      targetWeightKg: number | null;
      targetReps: number | null;
      type: ExerciseSetType;
      restSeconds: number;
    }>;
  }>;
};

export type ApiFetch = <T>(path: string, options?: RequestInit) => Promise<T>;
