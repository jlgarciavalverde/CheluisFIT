import request from "supertest";
import { ExerciseSource } from "@prisma/client";
import { app } from "../app";
import { prisma } from "../lib/prisma";

export const namespace = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type AuthState = {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    currentWeightKg: number;
    currentHeightCm: number;
  };
};

export let exerciseId = "";
export let bodyweightExerciseId = "";

export function createRegisterPayload(email: string) {
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

export async function registerUser(email: string): Promise<AuthState> {
  const result = await request(app).post("/api/auth/register").send(createRegisterPayload(email));
  if (result.status !== 201) {
    throw new Error(`Register failed (${result.status}): ${JSON.stringify(result.body)}`);
  }
  return result.body as AuthState;
}

export function authed(auth: AuthState) {
  const setAuth = (test: request.Test) => test.set("Authorization", `Bearer ${auth.token}`);

  return {
    delete: (path: string) => setAuth(request(app).delete(path)),
    get: (path: string) => setAuth(request(app).get(path)),
    patch: (path: string) => setAuth(request(app).patch(path)),
    post: (path: string) => setAuth(request(app).post(path)),
    put: (path: string) => setAuth(request(app).put(path)),
  };
}

export async function seedExercises() {
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
}

export async function cleanupTestData() {
  await prisma.user.deleteMany({
    where: { email: { endsWith: `.${namespace}@cheluisfit.test` } },
  });
  await prisma.exercise.deleteMany({
    where: { externalId: { in: [`${namespace}-bench-press`, `${namespace}-push-up`] } },
  });
  await prisma.$disconnect();
}
