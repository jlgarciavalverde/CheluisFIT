import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ExerciseSetType } from "@prisma/client";
import {
  authed,
  cleanupTestData,
  exerciseId,
  namespace,
  registerUser,
  seedExercises,
  type AuthState,
} from "./testUtils";

let auth: AuthState;

describe("Dashboard", () => {
  beforeAll(async () => {
    await seedExercises();
    auth = await registerUser(`dashboard.${namespace}@cheluisfit.test`);

    await authed(auth)
      .post("/api/me/body-measurements")
      .send({ weightKg: 80, heightCm: 180 });

    await authed(auth)
      .post("/api/me/body-measurements")
      .send({ weightKg: 79.5, heightCm: 180 });

    await authed(auth)
      .post("/api/workout-sessions")
      .send({
        performedAt: new Date().toISOString(),
        exercises: [
          {
            exerciseId,
            sets: [
              { weightKg: 60, reps: 8, type: ExerciseSetType.NORMAL },
              { weightKg: 60, reps: 8, type: ExerciseSetType.NORMAL },
            ],
          },
        ],
      });
  });

  afterAll(cleanupTestData);

  it("returns dashboard with workouts this week and body weight trend", async () => {
    const result = await authed(auth).get("/api/me/dashboard");
    const dashboard = result.body.data.data;

    expect(result.status).toBe(200);
    expect(dashboard).toHaveProperty("workoutsThisWeek");
    expect(dashboard.workoutsThisWeek).toBeGreaterThanOrEqual(1);
    expect(dashboard).toHaveProperty("bodyWeightTrend");
    expect(dashboard.bodyWeightTrend.length).toBeGreaterThanOrEqual(2);
  });

  it("returns dashboard even for a fresh user with no data", async () => {
    const freshAuth = await registerUser(`dashboard-fresh.${namespace}@cheluisfit.test`);
    const result = await authed(freshAuth).get("/api/me/dashboard");
    const dashboard = result.body.data.data;

    expect(result.status).toBe(200);
    expect(dashboard.workoutsThisWeek).toBe(0);
    expect(dashboard.bodyWeightTrend).toEqual([]);
  });
});
