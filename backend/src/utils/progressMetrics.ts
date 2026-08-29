export type ProgressMetricInput = {
  performedAt: Date;
  sessionId: string;
  sets: Array<{
    weightKg: number;
    reps: number;
  }>;
};

export type ProgressMetricPoint = {
  performedAt: string;
  sessionId: string;
  maxWeightKg: number;
  maxRepsAtMaxWeight: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
};

type MutableProgressPoint = Omit<ProgressMetricPoint, "performedAt"> & {
  performedAt: Date;
};

export function computeProgressMetrics(entries: ProgressMetricInput[]): ProgressMetricPoint[] {
  const progressBySession = new Map<string, MutableProgressPoint>();

  for (const entry of entries) {
    const progress =
      progressBySession.get(entry.sessionId) ??
      createEmptyProgress(entry.sessionId, entry.performedAt);

    for (const set of entry.sets) {
      progress.totalSets += 1;
      progress.totalReps += set.reps;
      progress.totalVolumeKg += set.weightKg * set.reps;

      if (set.weightKg > progress.maxWeightKg) {
        progress.maxWeightKg = set.weightKg;
        progress.maxRepsAtMaxWeight = set.reps;
      } else if (set.weightKg === progress.maxWeightKg) {
        progress.maxRepsAtMaxWeight = Math.max(progress.maxRepsAtMaxWeight, set.reps);
      }
    }

    progressBySession.set(entry.sessionId, progress);
  }

  return Array.from(progressBySession.values())
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime())
    .map((progress) => ({
      ...progress,
      performedAt: progress.performedAt.toISOString(),
    }));
}

function createEmptyProgress(sessionId: string, performedAt: Date): MutableProgressPoint {
  return {
    performedAt,
    sessionId,
    maxWeightKg: 0,
    maxRepsAtMaxWeight: 0,
    totalVolumeKg: 0,
    totalSets: 0,
    totalReps: 0,
  };
}
