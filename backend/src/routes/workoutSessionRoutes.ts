import { Router } from "express";
import { z } from "zod";
import { ExerciseSetType, WorkoutSessionStatus } from "@prisma/client";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  addWorkoutExercise,
  addWorkoutSet,
  createWorkoutSession,
  getActiveWorkoutSession,
  startWorkoutSession,
  updateWorkoutSession,
  updateWorkoutSet,
} from "../services/workoutService";
import { getAuthUser } from "../types/auth";

export const workoutSessionRoutes = Router();

const createWorkoutSessionSchema = z.object({
  performedAt: z.coerce.date().optional(),
  notes: z.string().trim().min(1).optional(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        order: z.number().int().positive().optional(),
        notes: z.string().trim().min(1).optional(),
        sets: z
          .array(
            z.object({
              setNumber: z.number().int().positive().optional(),
              weightKg: z.number().min(0),
              reps: z.number().int().min(1),
              type: z.nativeEnum(ExerciseSetType).optional(),
              restSeconds: z.number().int().min(0).max(900).optional(),
              completedAt: z.coerce.date().nullable().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const updateWorkoutSessionSchema = z.object({
  performedAt: z.coerce.date().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
  status: z.nativeEnum(WorkoutSessionStatus).optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

const updateExerciseSetSchema = z.object({
  setNumber: z.number().int().positive().optional(),
  weightKg: z.number().min(0).optional(),
  reps: z.number().int().min(1).optional(),
  type: z.nativeEnum(ExerciseSetType).optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
  completed: z.boolean().optional(),
});

const addWorkoutExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  notes: z.string().trim().min(1).optional(),
  sets: z
    .array(
      z.object({
        weightKg: z.number().min(0),
        reps: z.number().int().min(1),
        type: z.nativeEnum(ExerciseSetType).optional(),
        restSeconds: z.number().int().min(0).max(900).optional(),
      }),
    )
    .min(1),
});

const addWorkoutSetSchema = z.object({
  weightKg: z.number().min(0),
  reps: z.number().int().min(1),
  type: z.nativeEnum(ExerciseSetType).optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
});

workoutSessionRoutes.use(requireAuth);

workoutSessionRoutes.get("/active", async (req, res, next) => {
  try {
    const session = await getActiveWorkoutSession(getAuthUser(req).id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

workoutSessionRoutes.post("/", async (req, res, next) => {
  try {
    const input = createWorkoutSessionSchema.parse(req.body);
    const session = await createWorkoutSession(getAuthUser(req).id, input);

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});

workoutSessionRoutes.post("/start", async (req, res, next) => {
  try {
    const input = createWorkoutSessionSchema.parse(req.body);
    const session = await startWorkoutSession(getAuthUser(req).id, input);

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});

workoutSessionRoutes.patch("/:sessionId/sets/:setId", async (req, res, next) => {
  try {
    const set = await updateWorkoutSet(
      getAuthUser(req).id,
      req.params.sessionId,
      req.params.setId,
      updateExerciseSetSchema.parse(req.body),
    );

    res.json({ data: set });
  } catch (error) {
    next(error);
  }
});

workoutSessionRoutes.post("/:sessionId/exercises", async (req, res, next) => {
  try {
    const session = await addWorkoutExercise(
      getAuthUser(req).id,
      req.params.sessionId,
      addWorkoutExerciseSchema.parse(req.body),
    );

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});

workoutSessionRoutes.post("/:sessionId/exercises/:workoutExerciseId/sets", async (req, res, next) => {
  try {
    const session = await addWorkoutSet(
      getAuthUser(req).id,
      req.params.sessionId,
      req.params.workoutExerciseId,
      addWorkoutSetSchema.parse(req.body),
    );

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});

workoutSessionRoutes.patch("/:sessionId", async (req, res, next) => {
  try {
    const session = await updateWorkoutSession(
      getAuthUser(req).id,
      req.params.sessionId,
      updateWorkoutSessionSchema.parse(req.body),
    );

    res.json({ data: session });
  } catch (error) {
    next(error);
  }
});
