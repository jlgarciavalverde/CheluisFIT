import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

describe("Favorites", () => {
  beforeAll(async () => {
    await seedExercises();
    auth = await registerUser(`favorites.${namespace}@cheluisfit.test`);
  });

  afterAll(cleanupTestData);

  it("adds, lists and removes favorite exercises", async () => {
    const created = await authed(auth)
      .post("/api/favorite-exercises")
      .send({ exerciseId });

    expect(created.status).toBe(201);
    expect(created.body.data.exercise.id).toBe(exerciseId);

    const list = await authed(auth).get("/api/favorite-exercises");
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const removed = await authed(auth).delete(`/api/favorite-exercises/${exerciseId}`);
    expect(removed.status).toBe(204);

    const emptyList = await authed(auth).get("/api/favorite-exercises");
    expect(emptyList.body.data).toHaveLength(0);
  });

  it("handles duplicate favorite gracefully", async () => {
    await authed(auth).post("/api/favorite-exercises").send({ exerciseId });

    const duplicate = await authed(auth)
      .post("/api/favorite-exercises")
      .send({ exerciseId });

    expect([201, 409]).toContain(duplicate.status);

    await authed(auth).delete(`/api/favorite-exercises/${exerciseId}`);
  });
});
