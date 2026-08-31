import { Router } from "express";
import { MeasurementUnits, TrainingGoal } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "../middlewares/authMiddleware";
import { getExercisePicks, getExerciseStates } from "../services/exerciseService";
import { getAllTimeMuscleStats } from "../services/muscleStatsService";
import {
  addBodyMeasurement,
  deleteAccount,
  getProfile,
  getTrainingPreference,
  listBodyMeasurements,
  updateTrainingPreference,
  updateProfile,
} from "../services/profileService";
import { listWorkoutSessions } from "../services/workoutService";
import { getAuthUser } from "../types/auth";
import { asNumber, asString } from "../utils/queryHelpers";

export const profileRoutes = Router();

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName1: z.string().trim().min(1).optional(),
  lastName2: z.string().trim().min(1).nullable().optional(),
  birthDate: z.coerce.date().optional(),
  currentWeightKg: z.number().positive().optional(),
  currentHeightCm: z.number().int().positive().optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

const bodyMeasurementSchema = z.object({
  weightKg: z.number().positive(),
  heightCm: z.number().int().positive(),
  measuredAt: z.coerce.date().optional(),
});

const trainingPreferenceSchema = z.object({
  defaultRestSeconds: z.number().int().min(0).max(600).optional(),
  weeklyFrequency: z.number().int().min(1).max(14).optional(),
  goal: z.nativeEnum(TrainingGoal).optional(),
  units: z.nativeEnum(MeasurementUnits).optional(),
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
    const profile = await updateProfile(getAuthUser(req).id, updateProfileSchema.parse(req.body));

    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

profileRoutes.delete("/", async (req, res, next) => {
  try {
    const { password } = deleteAccountSchema.parse(req.body);
    await deleteAccount(getAuthUser(req).id, password);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/body-measurements", async (req, res, next) => {
  try {
    const measurements = await listBodyMeasurements(getAuthUser(req).id, {
      limit: asNumber(req.query.limit),
      offset: asNumber(req.query.offset),
    });
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

profileRoutes.get("/preferences", async (req, res, next) => {
  try {
    const preferences = await getTrainingPreference(getAuthUser(req).id);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

profileRoutes.patch("/preferences", async (req, res, next) => {
  try {
    const preferences = await updateTrainingPreference(
      getAuthUser(req).id,
      trainingPreferenceSchema.parse(req.body),
    );

    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/exercise-states", async (req, res, next) => {
  try {
    const exerciseIds = asString(req.query.exerciseIds)
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const states = await getExerciseStates(getAuthUser(req).id, exerciseIds);
    res.json(states);
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/exercise-picks", async (req, res, next) => {
  try {
    const picks = await getExercisePicks(getAuthUser(req).id);
    res.json(picks);
  } catch (error) {
    next(error);
  }
});

profileRoutes.get("/muscle-stats", async (req, res, next) => {
  try {
    const stats = await getAllTimeMuscleStats(getAuthUser(req).id);
    res.json(stats);
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
