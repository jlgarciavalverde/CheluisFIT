import { ExerciseSetType } from "@prisma/client";

export type MuscleSummaryPoint = {
  muscle: string;
  effectiveSets: number;
  recommendedMin: number;
  recommendedMax: number;
};

type WorkoutExerciseForMuscleSummary = {
  exercise: {
    targetMuscles: string[];
    secondaryMuscles: string[];
  };
  sets: Array<{
    type: ExerciseSetType;
  }>;
};

type SessionForMuscleSummary = {
  exercises: WorkoutExerciseForMuscleSummary[];
};

export function computeMuscleSummaryFromWorkoutExercises(
  workoutExercises: WorkoutExerciseForMuscleSummary[],
) {
  const summary = new Map<string, MuscleSummaryPoint>();

  for (const workoutExercise of workoutExercises) {
    const effectiveSetCount = workoutExercise.sets.filter(
      (set) => set.type !== ExerciseSetType.WARMUP,
    ).length;

    for (const muscle of workoutExercise.exercise.targetMuscles) {
      addMuscleSets(summary, muscle, effectiveSetCount);
    }

    for (const muscle of workoutExercise.exercise.secondaryMuscles) {
      addMuscleSets(summary, muscle, effectiveSetCount * 0.5);
    }
  }

  return sortMuscleSummary(summary);
}

export function computeMuscleSummaryFromSessions(sessions: SessionForMuscleSummary[]) {
  const summary = new Map<string, MuscleSummaryPoint>();

  for (const session of sessions) {
    const sessionSummary = computeMuscleSummaryFromWorkoutExercises(session.exercises);

    for (const point of sessionSummary) {
      addMuscleSets(summary, point.muscle, point.effectiveSets);
    }
  }

  return sortMuscleSummary(summary);
}

export function computeDurationMinutes(startedAt: Date, completedAt: Date | null) {
  if (!completedAt) return null;
  const durationMs = completedAt.getTime() - startedAt.getTime();
  if (durationMs < 0) return null;
  return Math.round(durationMs / 60_000);
}

function addMuscleSets(summary: Map<string, MuscleSummaryPoint>, muscle: string, value: number) {
  const key = muscle.toLowerCase();
  const current = summary.get(key) ?? {
    muscle,
    effectiveSets: 0,
    recommendedMin: 4,
    recommendedMax: 6,
  };

  current.effectiveSets += value;
  summary.set(key, current);
}

function sortMuscleSummary(summary: Map<string, MuscleSummaryPoint>) {
  return Array.from(summary.values()).sort((a, b) => b.effectiveSets - a.effectiveSets);
}
