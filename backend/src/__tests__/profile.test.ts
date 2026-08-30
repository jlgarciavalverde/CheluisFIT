import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MeasurementUnits, TrainingGoal } from "@prisma/client";
import {
  authed,
  cleanupTestData,
  namespace,
  registerUser,
  seedExercises,
  type AuthState,
} from "./testUtils";

let auth: AuthState;

describe("Profile & Preferences", () => {
  beforeAll(async () => {
    await seedExercises();
    auth = await registerUser(`profile.${namespace}@cheluisfit.test`);
  });

  afterAll(cleanupTestData);

  it("returns and updates the authenticated profile", async () => {
    const profile = await authed(auth).get("/api/me");

    expect(profile.status).toBe(200);
    expect(profile.body.data).not.toHaveProperty("passwordHash");
    expect(profile.body.data.email).toBe(auth.user.email);

    const updated = await authed(auth).patch("/api/me").send({
      firstName: "Updated",
      lastName1: "Name",
      birthDate: "1990-01-01",
      currentWeightKg: 85,
      currentHeightCm: 182,
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.firstName).toBe("Updated");
    expect(updated.body.data.currentWeightKg).toBe(85);
  });

  it("creates and lists body measurements", async () => {
    const measurement = await authed(auth)
      .post("/api/me/body-measurements")
      .send({ weightKg: 82.5, heightCm: 181, measuredAt: "2026-01-01" });

    expect(measurement.status).toBe(201);
    expect(measurement.body.data.weightKg).toBe(82.5);

    const measurements = await authed(auth).get("/api/me/body-measurements");
    expect(measurements.status).toBe(200);
    expect(measurements.body.data.length).toBeGreaterThan(0);
  });

  it("persists training preferences with validation", async () => {
    const defaults = await authed(auth).get("/api/me/preferences");

    expect(defaults.status).toBe(200);
    expect(defaults.body.data).toMatchObject({
      defaultRestSeconds: 90,
      weeklyFrequency: 4,
      goal: TrainingGoal.HYPERTROPHY,
      units: MeasurementUnits.METRIC,
    });

    const updated = await authed(auth)
      .patch("/api/me/preferences")
      .send({
        defaultRestSeconds: 120,
        weeklyFrequency: 5,
        goal: TrainingGoal.STRENGTH,
        units: MeasurementUnits.METRIC,
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      defaultRestSeconds: 120,
      weeklyFrequency: 5,
      goal: TrainingGoal.STRENGTH,
    });

    const invalid = await authed(auth)
      .patch("/api/me/preferences")
      .send({ weeklyFrequency: 0 });

    expect(invalid.status).toBe(400);
  });
});
