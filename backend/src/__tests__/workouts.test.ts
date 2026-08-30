import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ExerciseSetType, WorkoutSessionStatus } from "@prisma/client";
import {
  authed,
  bodyweightExerciseId,
  cleanupTestData,
  exerciseId,
  namespace,
  registerUser,
  seedExercises,
  type AuthState,
} from "./testUtils";

let auth: AuthState;

describe("Workouts", () => {
  beforeAll(async () => {
    await seedExercises();
    auth = await registerUser(`workouts.${namespace}@cheluisfit.test`);
  });

  afterAll(cleanupTestData);

  it("creates workouts and lists history with progress", async () => {
    const firstWorkout = await authed(auth)
      .post("/api/workout-sessions")
      .send({
        performedAt: "2026-01-02T10:00:00.000Z",
        exercises: [
          {
            exerciseId,
            sets: [
              { weightKg: 50, reps: 8 },
              { weightKg: 60, reps: 5 },
              { weightKg: 60, reps: 7 },
            ],
          },
        ],
      });

    expect(firstWorkout.status).toBe(201);

    const secondWorkout = await authed(auth)
      .post("/api/workout-sessions")
      .send({
        performedAt: "2026-01-03T10:00:00.000Z",
        exercises: [
          {
            exerciseId,
            sets: [
              { weightKg: 65, reps: 3 },
              { weightKg: 55, reps: 10 },
            ],
          },
        ],
      });

    expect(secondWorkout.status).toBe(201);

    const history = await authed(auth).get("/api/me/workout-sessions");
    expect(history.status).toBe(200);
    expect(history.body.total).toBeGreaterThanOrEqual(2);

    const progress = await authed(auth).get(`/api/exercises/${exerciseId}/progress`);
    expect(progress.status).toBe(200);
    expect(progress.body.data).toMatchObject([
      { maxWeightKg: 60, totalSets: 3 },
      { maxWeightKg: 65, totalSets: 2 },
    ]);
  });

  it("starts active workout, completes sets and finishes", async () => {
    const started = await authed(auth)
      .post("/api/workout-sessions/start")
      .send({
        exercises: [
          {
            exerciseId,
            sets: [
              { weightKg: 20, reps: 12, type: ExerciseSetType.WARMUP, restSeconds: 60 },
              { weightKg: 50, reps: 10, type: ExerciseSetType.NORMAL, restSeconds: 120 },
            ],
          },
        ],
      });

    expect(started.status).toBe(201);
    expect(started.body.data.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
    expect(started.body.data.muscleSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ muscle: "pectorals", effectiveSets: 1 }),
      ]),
    );

    const sessionId = started.body.data.id as string;
    const setId = started.body.data.exercises[0].sets[1].id as string;

    const active = await authed(auth).get("/api/workout-sessions/active");
    expect(active.status).toBe(200);
    expect(active.body.data.id).toBe(sessionId);

    const updatedSet = await authed(auth)
      .patch(`/api/workout-sessions/${sessionId}/sets/${setId}`)
      .send({ completed: true, type: ExerciseSetType.DROPSET, restSeconds: 45 });

    expect(updatedSet.status).toBe(200);
    expect(updatedSet.body.data.type).toBe(ExerciseSetType.DROPSET);
    expect(updatedSet.body.data.completedAt).toEqual(expect.any(String));

    const addedExercise = await authed(auth)
      .post(`/api/workout-sessions/${sessionId}/exercises`)
      .send({
        exerciseId: bodyweightExerciseId,
        sets: [{ weightKg: 0, reps: 12, type: ExerciseSetType.NORMAL, restSeconds: 90 }],
      });

    expect(addedExercise.status).toBe(201);
    expect(addedExercise.body.data.exercises).toHaveLength(2);

    const completed = await authed(auth)
      .patch(`/api/workout-sessions/${sessionId}`)
      .send({ status: WorkoutSessionStatus.COMPLETED });

    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe(WorkoutSessionStatus.COMPLETED);

    const noActive = await authed(auth).get("/api/workout-sessions/active");
    expect(noActive.status).toBe(200);
    expect(noActive.body.data).toBeNull();
  });

  it("validates workout payloads", async () => {
    const emptyWorkout = await authed(auth)
      .post("/api/workout-sessions")
      .send({ exercises: [] });
    expect(emptyWorkout.status).toBe(400);

    const negativeWeight = await authed(auth)
      .post("/api/workout-sessions")
      .send({
        exercises: [{ exerciseId, sets: [{ weightKg: -1, reps: 10 }] }],
      });
    expect(negativeWeight.status).toBe(400);

    const invalidReps = await authed(auth)
      .post("/api/workout-sessions")
      .send({
        exercises: [{ exerciseId, sets: [{ weightKg: 10, reps: 0 }] }],
      });
    expect(invalidReps.status).toBe(400);
  });

  it("rejects editing a set on a completed workout", async () => {
    const workout = await authed(auth)
      .post("/api/workout-sessions/start")
      .send({
        exercises: [
          {
            exerciseId,
            sets: [{ weightKg: 40, reps: 10, type: ExerciseSetType.NORMAL, restSeconds: 90 }],
          },
        ],
      });

    const sessionId = workout.body.data.id as string;
    const setId = workout.body.data.exercises[0].sets[0].id as string;

    await authed(auth)
      .patch(`/api/workout-sessions/${sessionId}`)
      .send({ status: WorkoutSessionStatus.COMPLETED });

    const editCompletedSet = await authed(auth)
      .patch(`/api/workout-sessions/${sessionId}/sets/${setId}`)
      .send({ reps: 11 });
    expect(editCompletedSet.status).toBe(409);
  });
});
