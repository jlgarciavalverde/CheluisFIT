import { describe, expect, it } from "vitest";
import { computeProgressMetrics } from "./progressMetrics";

describe("computeProgressMetrics", () => {
  it("groups repeated exercise entries by session and orders chronologically", () => {
    const points = computeProgressMetrics([
      {
        performedAt: new Date("2026-01-03T10:00:00.000Z"),
        sessionId: "session-2",
        sets: [
          { weightKg: 70, reps: 3 },
          { weightKg: 60, reps: 10 },
        ],
      },
      {
        performedAt: new Date("2026-01-02T10:00:00.000Z"),
        sessionId: "session-1",
        sets: [
          { weightKg: 50, reps: 8 },
          { weightKg: 60, reps: 5 },
        ],
      },
      {
        performedAt: new Date("2026-01-02T10:00:00.000Z"),
        sessionId: "session-1",
        sets: [{ weightKg: 60, reps: 7 }],
      },
    ]);

    expect(points).toEqual([
      {
        performedAt: "2026-01-02T10:00:00.000Z",
        sessionId: "session-1",
        maxWeightKg: 60,
        maxRepsAtMaxWeight: 7,
        totalVolumeKg: 1120,
        totalSets: 3,
        totalReps: 20,
      },
      {
        performedAt: "2026-01-03T10:00:00.000Z",
        sessionId: "session-2",
        maxWeightKg: 70,
        maxRepsAtMaxWeight: 3,
        totalVolumeKg: 810,
        totalSets: 2,
        totalReps: 13,
      },
    ]);
  });
});
