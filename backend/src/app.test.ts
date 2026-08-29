import { SignJWT } from "jose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ExerciseSetType, ExerciseSource, WorkoutSessionStatus } from "@prisma/client";
import { app } from "./app";
import { prisma } from "./lib/prisma";

const namespace = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const localSecret =
  process.env.JWT_SECRET ?? "cheluisfit-local-development-secret-change-me";

type AuthState = {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    currentWeightKg: number;
    currentHeightCm: number;
  };
};

let exerciseId = "";
let bodyweightExerciseId = "";
let primaryAuth: AuthState;
let secondaryAuth: AuthState;
let templateId = "";

describe("CheluisFIT API", () => {
  beforeAll(async () => {
    const exercise = await prisma.exercise.upsert({
      where: {
        source_externalId: {
          source: ExerciseSource.EXERCISE_LIBRARY,
          externalId: `${namespace}-bench-press`,
        },
      },
      create: {
        externalId: `${namespace}-bench-press`,
        source: ExerciseSource.EXERCISE_LIBRARY,
        name: `Bench Press ${namespace}`,
        gifUrl: "https://example.com/bench.gif",
        targetMuscles: ["pectorals"],
        secondaryMuscles: ["triceps", "delts"],
        bodyParts: ["chest"],
        equipment: ["barbell"],
        instructions: ["Lower under control.", "Press with stable shoulders."],
      },
      update: {},
    });

    exerciseId = exercise.id;

    const bodyweightExercise = await prisma.exercise.upsert({
      where: {
        source_externalId: {
          source: ExerciseSource.EXERCISE_LIBRARY,
          externalId: `${namespace}-push-up`,
        },
      },
      create: {
        externalId: `${namespace}-push-up`,
        source: ExerciseSource.EXERCISE_LIBRARY,
        name: `Push Up ${namespace}`,
        gifUrl: "https://example.com/push-up.gif",
        targetMuscles: ["pectorals"],
        secondaryMuscles: ["triceps"],
        bodyParts: ["chest"],
        equipment: ["body weight"],
        instructions: ["Keep the trunk stable."],
      },
      update: {},
    });

    bodyweightExerciseId = bodyweightExercise.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { endsWith: `.${namespace}@cheluisfit.test` } },
    });
    await prisma.exercise.deleteMany({
      where: { externalId: { in: [`${namespace}-bench-press`, `${namespace}-push-up`] } },
    });
    await prisma.$disconnect();
  });

  it("registers a user without exposing passwordHash and rejects duplicate email", async () => {
    primaryAuth = await registerUser(`primary.${namespace}@cheluisfit.test`);

    expect(primaryAuth.token).toContain(".");
    expect(primaryAuth.user.email).toBe(`primary.${namespace}@cheluisfit.test`);
    expect(primaryAuth.user).not.toHaveProperty("passwordHash");

    const duplicate = await request(app)
      .post("/api/auth/register")
      .send(createRegisterPayload(`primary.${namespace}@cheluisfit.test`));

    expect(duplicate.status).toBe(409);
  });

  it("logs in with valid credentials and rejects bad credentials", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: `primary.${namespace}@cheluisfit.test`,
      password: "Password123!",
    });

    expect(login.status).toBe(200);
    expect(login.body.user).not.toHaveProperty("passwordHash");
    expect(login.body.token).toContain(".");

    const badLogin = await request(app).post("/api/auth/login").send({
      email: `primary.${namespace}@cheluisfit.test`,
      password: "wrong-password",
    });

    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error).toBe("Invalid email or password");
  });

  it("protects private endpoints for missing, invalid and expired tokens", async () => {
    const noToken = await request(app).get("/api/me");
    expect(noToken.status).toBe(401);
    expect(noToken.body.error).toBe("Authentication required");

    const invalidToken = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(invalidToken.status).toBe(401);
    expect(invalidToken.body.error).toBe("Authentication required");

    const expiredToken = await new SignJWT({ email: primaryAuth.user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(primaryAuth.user.id)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(localSecret));

    const expired = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(expired.status).toBe(401);
    expect(expired.body.error).toBe("Authentication required");
  });

  it("returns and updates the authenticated profile and body measurements", async () => {
    const profile = await authed(primaryAuth).get("/api/me");

    expect(profile.status).toBe(200);
    expect(profile.body.data).not.toHaveProperty("passwordHash");
    expect(profile.body.data.email).toBe(primaryAuth.user.email);

    const measurement = await authed(primaryAuth)
      .post("/api/me/body-measurements")
      .send({ weightKg: 82.5, heightCm: 181, measuredAt: "2026-01-01" });

    expect(measurement.status).toBe(201);
    expect(measurement.body.data.weightKg).toBe(82.5);

    const measurements = await authed(primaryAuth).get("/api/me/body-measurements");
    expect(measurements.status).toBe(200);
    expect(measurements.body.data.length).toBeGreaterThan(0);
  });

  it("searches local exercises", async () => {
    const result = await request(app).get(
      `/api/exercises?q=${encodeURIComponent(namespace)}&targetMuscle=pectorals`,
    );

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: exerciseId })]),
    );
  });

  it("adds, lists and removes favorite exercises", async () => {
    const created = await authed(primaryAuth)
      .post("/api/favorite-exercises")
      .send({ exerciseId });

    expect(created.status).toBe(201);
    expect(created.body.data.exercise.id).toBe(exerciseId);

    const list = await authed(primaryAuth).get("/api/favorite-exercises");
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const removed = await authed(primaryAuth).delete(`/api/favorite-exercises/${exerciseId}`);
    expect(removed.status).toBe(204);

    const emptyList = await authed(primaryAuth).get("/api/favorite-exercises");
    expect(emptyList.body.data).toHaveLength(0);
  });

  it("creates workouts, lists history and calculates progress chronologically", async () => {
    const firstWorkout = await authed(primaryAuth)
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

    const secondWorkout = await authed(primaryAuth)
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

    const history = await authed(primaryAuth).get("/api/me/workout-sessions");
    expect(history.status).toBe(200);
    expect(history.body.total).toBeGreaterThanOrEqual(2);

    const progress = await authed(primaryAuth).get(`/api/exercises/${exerciseId}/progress`);
    expect(progress.status).toBe(200);
    expect(progress.body.data).toMatchObject([
      {
        maxWeightKg: 60,
        maxRepsAtMaxWeight: 7,
        totalVolumeKg: 1120,
        totalSets: 3,
        totalReps: 20,
      },
      {
        maxWeightKg: 65,
        maxRepsAtMaxWeight: 3,
        totalVolumeKg: 745,
        totalSets: 2,
        totalReps: 13,
      },
    ]);
  });

  it("starts an active workout, updates set completion and computes muscle summary", async () => {
    const started = await authed(primaryAuth)
      .post("/api/workout-sessions/start")
      .send({
        exercises: [
          {
            exerciseId,
            sets: [
              {
                weightKg: 20,
                reps: 12,
                type: ExerciseSetType.WARMUP,
                restSeconds: 60,
              },
              {
                weightKg: 50,
                reps: 10,
                type: ExerciseSetType.NORMAL,
                restSeconds: 120,
              },
            ],
          },
        ],
      });

    expect(started.status).toBe(201);
    expect(started.body.data.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
    expect(started.body.data.exercises[0].sets[0]).toMatchObject({
      type: ExerciseSetType.WARMUP,
      restSeconds: 60,
    });
    expect(started.body.data.muscleSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          muscle: "pectorals",
          effectiveSets: 1,
          recommendedMin: 4,
          recommendedMax: 6,
        }),
        expect.objectContaining({
          muscle: "triceps",
          effectiveSets: 0.5,
        }),
      ]),
    );

    const sessionId = started.body.data.id as string;
    const setId = started.body.data.exercises[0].sets[1].id as string;

    const active = await authed(primaryAuth).get("/api/workout-sessions/active");
    expect(active.status).toBe(200);
    expect(active.body.data.id).toBe(sessionId);

    const updatedSet = await authed(primaryAuth)
      .patch(`/api/workout-sessions/${sessionId}/sets/${setId}`)
      .send({ completed: true, type: ExerciseSetType.DROPSET, restSeconds: 45 });

    expect(updatedSet.status).toBe(200);
    expect(updatedSet.body.data.type).toBe(ExerciseSetType.DROPSET);
    expect(updatedSet.body.data.completedAt).toEqual(expect.any(String));

    const addedExercise = await authed(primaryAuth)
      .post(`/api/workout-sessions/${sessionId}/exercises`)
      .send({
        exerciseId: bodyweightExerciseId,
        sets: [{ weightKg: 0, reps: 12, type: ExerciseSetType.NORMAL, restSeconds: 90 }],
      });

    expect(addedExercise.status).toBe(201);
    expect(addedExercise.body.data.exercises).toHaveLength(2);

    const addedWorkoutExerciseId = addedExercise.body.data.exercises[1].id as string;
    const addedSet = await authed(primaryAuth)
      .post(`/api/workout-sessions/${sessionId}/exercises/${addedWorkoutExerciseId}/sets`)
      .send({ weightKg: 0, reps: 14, type: ExerciseSetType.DROPSET, restSeconds: 60 });

    expect(addedSet.status).toBe(201);
    expect(addedSet.body.data.exercises[1].sets).toHaveLength(2);
    expect(addedSet.body.data.exercises[1].sets[1]).toMatchObject({
      reps: 14,
      type: ExerciseSetType.DROPSET,
    });

    const completed = await authed(primaryAuth)
      .patch(`/api/workout-sessions/${sessionId}`)
      .send({ status: WorkoutSessionStatus.COMPLETED });

    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe(WorkoutSessionStatus.COMPLETED);
    expect(completed.body.data.completedAt).toEqual(expect.any(String));

    const noActive = await authed(primaryAuth).get("/api/workout-sessions/active");
    expect(noActive.status).toBe(200);
    expect(noActive.body.data).toBeNull();

    const editCompletedSet = await authed(primaryAuth)
      .patch(`/api/workout-sessions/${sessionId}/sets/${setId}`)
      .send({ reps: 11 });
    expect(editCompletedSet.status).toBe(409);
  });

  it("returns progression suggestions for load, bodyweight and no-history cases", async () => {
    const loadProgression = await authed(primaryAuth).get(
      `/api/exercises/${exerciseId}/progression`,
    );

    expect(loadProgression.status).toBe(200);
    expect(loadProgression.body.data.status).toBe("INCREASE_LOAD");
    expect(loadProgression.body.data.suggestion.incrementKg).toBe(2.5);

    const noHistoryAuth = await registerUser(`no-history.${namespace}@cheluisfit.test`);
    const noHistory = await authed(noHistoryAuth).get(
      `/api/exercises/${bodyweightExerciseId}/progression`,
    );

    expect(noHistory.status).toBe(200);
    expect(noHistory.body.data.status).toBe("NO_HISTORY");

    const bodyweightWorkout = await authed(primaryAuth)
      .post("/api/workout-sessions")
      .send({
        exercises: [
          {
            exerciseId: bodyweightExerciseId,
            sets: [{ weightKg: 0, reps: 12, type: ExerciseSetType.NORMAL }],
          },
        ],
      });

    expect(bodyweightWorkout.status).toBe(201);

    const bodyweightProgression = await authed(primaryAuth).get(
      `/api/exercises/${bodyweightExerciseId}/progression`,
    );

    expect(bodyweightProgression.status).toBe(200);
    expect(bodyweightProgression.body.data.status).toBe("INCREASE_REPS");
    expect(bodyweightProgression.body.data.suggestion.incrementKg).toBe(0);
  });

  it("blocks workout history access from another user", async () => {
    secondaryAuth = await registerUser(`secondary.${namespace}@cheluisfit.test`);

    const result = await authed(secondaryAuth).get(
      `/api/users/${primaryAuth.user.id}/workout-sessions`,
    );

    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Forbidden");
  });

  it("creates, clones, lists and starts workout templates", async () => {
    const created = await authed(primaryAuth)
      .post("/api/workout-templates")
      .send({
        name: "Rutina pecho",
        exercises: [
          {
            exerciseId,
            sets: [
              { targetWeightKg: 60, targetReps: 8 },
              {
                targetWeightKg: 62.5,
                targetReps: 6,
                type: ExerciseSetType.SUPERSET,
                restSeconds: 75,
              },
            ],
          },
        ],
      });

    expect(created.status).toBe(201);
    templateId = created.body.data.id;

    const list = await authed(primaryAuth).get("/api/workout-templates");
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: templateId })]),
    );

    const cloned = await authed(primaryAuth).post(`/api/workout-templates/${templateId}/clone`);
    expect(cloned.status).toBe(201);
    expect(cloned.body.data.name).toContain("copia");

    const started = await authed(primaryAuth).post(`/api/workout-templates/${templateId}/start`);
    expect(started.status).toBe(201);
    expect(started.body.data.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
    expect(started.body.data.exercises[0].sets).toHaveLength(2);

    await authed(primaryAuth)
      .patch(`/api/workout-sessions/${started.body.data.id}`)
      .send({ status: WorkoutSessionStatus.COMPLETED });
  });

  it("validates workout and template payloads", async () => {
    const emptyWorkout = await authed(primaryAuth)
      .post("/api/workout-sessions")
      .send({ exercises: [] });
    expect(emptyWorkout.status).toBe(400);

    const negativeWeight = await authed(primaryAuth)
      .post("/api/workout-sessions")
      .send({
        exercises: [
          {
            exerciseId,
            sets: [{ weightKg: -1, reps: 10 }],
          },
        ],
      });
    expect(negativeWeight.status).toBe(400);

    const invalidReps = await authed(primaryAuth)
      .post("/api/workout-sessions")
      .send({
        exercises: [
          {
            exerciseId,
            sets: [{ weightKg: 10, reps: 0 }],
          },
        ],
      });
    expect(invalidReps.status).toBe(400);

    const emptyTemplate = await authed(primaryAuth)
      .post("/api/workout-templates")
      .send({ name: "Vacia", exercises: [] });
    expect(emptyTemplate.status).toBe(400);
  });
});

async function registerUser(email: string): Promise<AuthState> {
  const result = await request(app).post("/api/auth/register").send(createRegisterPayload(email));
  expect(result.status).toBe(201);
  return result.body as AuthState;
}

function createRegisterPayload(email: string) {
  return {
    firstName: "Test",
    lastName1: "User",
    lastName2: "Api",
    birthDate: "1990-01-01",
    currentWeightKg: 80,
    currentHeightCm: 180,
    email,
    password: "Password123!",
  };
}

function authed(auth: AuthState) {
  const setAuth = (test: request.Test) =>
    test.set("Authorization", `Bearer ${auth.token}`);

  return {
    delete: (path: string) => setAuth(request(app).delete(path)),
    get: (path: string) => setAuth(request(app).get(path)),
    patch: (path: string) => setAuth(request(app).patch(path)),
    post: (path: string) => setAuth(request(app).post(path)),
    put: (path: string) => setAuth(request(app).put(path)),
  };
}
