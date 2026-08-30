import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ExerciseSetType, WorkoutSessionStatus } from "@prisma/client";
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
let templateId = "";

describe("Templates", () => {
  beforeAll(async () => {
    await seedExercises();
    auth = await registerUser(`templates.${namespace}@cheluisfit.test`);
  });

  afterAll(cleanupTestData);

  it("creates, lists, clones and starts workout templates", async () => {
    const created = await authed(auth)
      .post("/api/workout-templates")
      .send({
        name: "Rutina pecho",
        exercises: [
          {
            exerciseId,
            sets: [
              { targetWeightKg: 60, targetReps: 8 },
              { targetWeightKg: 62.5, targetReps: 6, type: ExerciseSetType.SUPERSET, restSeconds: 75 },
            ],
          },
        ],
      });

    expect(created.status).toBe(201);
    templateId = created.body.data.id;

    const list = await authed(auth).get("/api/workout-templates");
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: templateId })]),
    );

    const cloned = await authed(auth).post(`/api/workout-templates/${templateId}/clone`);
    expect(cloned.status).toBe(201);
    expect(cloned.body.data.name).toContain("copia");

    const started = await authed(auth).post(`/api/workout-templates/${templateId}/start`);
    expect(started.status).toBe(201);
    expect(started.body.data.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
    expect(started.body.data.exercises[0].sets).toHaveLength(2);

    await authed(auth)
      .patch(`/api/workout-sessions/${started.body.data.id}`)
      .send({ status: WorkoutSessionStatus.COMPLETED });
  });

  it("updates a template", async () => {
    const updated = await authed(auth)
      .put(`/api/workout-templates/${templateId}`)
      .send({
        name: "Rutina pecho actualizada",
        exercises: [
          {
            exerciseId,
            sets: [{ targetWeightKg: 65, targetReps: 6 }],
          },
        ],
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe("Rutina pecho actualizada");
  });

  it("deletes a template", async () => {
    const created = await authed(auth)
      .post("/api/workout-templates")
      .send({
        name: "Para borrar",
        exercises: [
          { exerciseId, sets: [{ targetWeightKg: 40, targetReps: 10 }] },
        ],
      });

    const deleteResult = await authed(auth).delete(`/api/workout-templates/${created.body.data.id}`);
    expect(deleteResult.status).toBe(204);
  });

  it("validates template payloads", async () => {
    const emptyTemplate = await authed(auth)
      .post("/api/workout-templates")
      .send({ name: "Vacia", exercises: [] });
    expect(emptyTemplate.status).toBe(400);
  });
});
