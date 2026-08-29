import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  addBodyMeasurement,
  getProfile,
  listBodyMeasurements,
  updateProfile,
} from "../services/profileService";
import { listWorkoutSessions } from "../services/workoutService";
import { getAuthUser } from "../types/auth";

export const profileRoutes = Router();

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName1: z.string().trim().min(1).optional(),
  lastName2: z.string().trim().min(1).nullable().optional(),
  birthDate: z.coerce.date().optional(),
  currentWeightKg: z.number().positive().optional(),
  currentHeightCm: z.number().int().positive().optional(),
});

const bodyMeasurementSchema = z.object({
  weightKg: z.number().positive(),
  heightCm: z.number().int().positive(),
  measuredAt: z.coerce.date().optional(),
});

profileRoutes.use(requireAuth);

profileRoutes.get("/", async (req, res, next) => {
  try {
    const profile = await getProfile(getAuthUser(req).id);
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

profileRoutes.patch("/", async (req, res, next) => {
  try {
    const profile = await updateProfile(
      getAuthUser(req).id,
      updateProfileSchema.parse(req.body),
    );

    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/body-measurements", async (req, res, next) => {
  try {
    const measurements = await listBodyMeasurements(getAuthUser(req).id);
    res.json(measurements);
  } catch (error) {
    next(error);
  }
});

profileRoutes.post("/body-measurements", async (req, res, next) => {
  try {
    const measurement = await addBodyMeasurement(
      getAuthUser(req).id,
      bodyMeasurementSchema.parse(req.body),
    );

    res.status(201).json({ data: measurement });
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/workout-sessions", async (req, res, next) => {
  try {
    const sessions = await listWorkoutSessions({
      userId: getAuthUser(req).id,
      limit: asNumber(req.query.limit),
      offset: asNumber(req.query.offset),
    });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

function asNumber(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
