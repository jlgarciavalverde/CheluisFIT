import { Router } from "express";
import {
  getExerciseFacets,
  getLocalExerciseById,
  listLocalExercises,
  searchExternalExercises,
} from "../services/exerciseService";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  getExerciseProgress,
  getExerciseProgression,
  getExerciseRecords,
} from "../services/workoutService";
import { getAuthUser } from "../types/auth";

export const exerciseRoutes = Router();

exerciseRoutes.get("/facets", async (_req, res, next) => {
  try {
    const facets = await getExerciseFacets();
    res.json(facets);
  } catch (error) {
    next(error);
  }
});

exerciseRoutes.get("/", async (req, res, next) => {
  try {
    const exercises = await listLocalExercises({
      q: asString(req.query.q),
      targetMuscle: asString(req.query.targetMuscle),
      secondaryMuscle: asString(req.query.secondaryMuscle),
      bodyPart: asString(req.query.bodyPart),
      equipment: asString(req.query.equipment),
      limit: asNumber(req.query.limit),
      offset: asNumber(req.query.offset),
    });

    res.json(exercises);
  } catch (error) {
    next(error);
  }
});

exerciseRoutes.get("/external/search", async (req, res, next) => {
  try {
    const exercises = await searchExternalExercises(
      asString(req.query.q) ?? "",
      asNumber(req.query.limit),
      asNumber(req.query.offset),
    );

    res.json(exercises);
  } catch (error) {
    next(error);
  }
});

exerciseRoutes.get("/:exerciseId/progress", requireAuth, async (req, res, next) => {
  try {
    const progress = await getExerciseProgress(
      getAuthUser(req).id,
      req.params.exerciseId,
    );
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

exerciseRoutes.get("/:exerciseId/records", requireAuth, async (req, res, next) => {
  try {
    const records = await getExerciseRecords(
      getAuthUser(req).id,
      req.params.exerciseId,
    );

    res.json({ data: records });
  } catch (error) {
    next(error);
  }
});

exerciseRoutes.get("/:exerciseId/progression", requireAuth, async (req, res, next) => {
  try {
    const progression = await getExerciseProgression(
      getAuthUser(req).id,
      req.params.exerciseId,
    );

    res.json(progression);
  } catch (error) {
    next(error);
  }
});

exerciseRoutes.get("/:id", async (req, res, next) => {
  try {
    const exercise = await getLocalExerciseById(req.params.id);

    if (!exercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    res.json({ data: exercise });
  } catch (error) {
    next(error);
  }
});

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
