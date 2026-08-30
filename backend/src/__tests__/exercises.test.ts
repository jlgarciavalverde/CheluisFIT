import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ExerciseSetType } from "@prisma/client";
import { app } from "../app";
import {
  authed,
  cleanupTestData,
  exerciseId,
  bodyweightExerciseId,
  namespace,
  registerUser,
  seedExercises,
  type AuthState,
} from "./testUtils";

let auth: AuthState;

describe("Exercises", () => {
  beforeAll(async () => {
    await seedExercises();
    auth = await registerUser(`exercises.${namespace}@cheluisfit.test`);
  });

  afterAll(cleanupTestData);

  it("searches local exercises by query and muscle", async () => {
    const result = await request(app).get(
      `/api/exercises?q=${encodeURIComponent(namespace)}&targetMuscle=pectorals`,
    );

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: exerciseId })]),
    );
  });

  it("returns exercise facets for filters", async () => {
    const result = await request(app).get("/api/exercises/facets");

    expect(result.status).toBe(200);
    expect(result.body.data.targetMuscles).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "pectorals" })]),
    );
    expect(result.body.data.equipment).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "barbell" })]),
    );
  });

  it("returns exercise states for favorites, history and routines", async () => {
    await authed(auth).post("/api/favorite-exercises").send({ exerciseId });

    await authed(auth)
      .post("/api/workout-sessions")
      .send({
        performedAt: new Date().toISOString(),
        exercises: [
          { exerciseId, sets: [{ weightKg: 70, reps: 5, type: ExerciseSetType.NORMAL }] },
        ],
      });

    await authed(auth)
      .post("/api/workout-templates")
      .send({
        name: "Exercise states test",
        exercises: [{ exerciseId, sets: [{ targetWeightKg: 70, targetReps: 5 }] }],
      });

    const result = await authed(auth).get(
      `/api/me/exercise-states?exerciseIds=${exerciseId},${bodyweightExerciseId}`,
    );

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId,
          isFavorite: true,
          usedRecently: true,
          inRoutine: true,
        }),
        expect.objectContaining({
          exerciseId: bodyweightExerciseId,
          isFavorite: false,
        }),
      ]),
    );
  });

  it("returns progression suggestions", async () => {
    const progression = await authed(auth).get(`/api/exercises/${exerciseId}/progression`);

    expect(progression.status).toBe(200);
    expect(["INCREASE_LOAD", "INCREASE_REPS"]).toContain(progression.body.data.status);
  });
});
