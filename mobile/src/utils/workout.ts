import type { WorkoutSession } from "../api/types";

export function totalVolume(session: WorkoutSession) {
  return session.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal +
      exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + set.weightKg * set.reps, 0),
    0,
  );
}

export function totalSets(session: WorkoutSession) {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

export function completedSets(session: WorkoutSession) {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completedAt).length,
    0,
  );
}

export function effectiveSets(session: WorkoutSession) {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.type !== "WARMUP").length,
    0,
  );
}

export function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function formatDuration(startedAt: string) {
  const diffMs = Math.max(Date.now() - new Date(startedAt).getTime(), 0);
  const minutes = Math.floor(diffMs / 60000);
  return `${minutes}m`;
}
