import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  addFavoriteExercise,
  listFavoriteExercises,
  removeFavoriteExercise,
} from "../services/favoriteService";
import { getAuthUser } from "../types/auth";
import { asNumber } from "../utils/queryHelpers";

export const favoriteRoutes = Router();

const favoriteSchema = z.object({
  exerciseId: z.string().min(1),
});

favoriteRoutes.use(requireAuth);

favoriteRoutes.get("/", async (req, res, next) => {
  try {
    const favorites = await listFavoriteExercises(getAuthUser(req).id, {
      limit: asNumber(req.query.limit),
      offset: asNumber(req.query.offset),
    });
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

favoriteRoutes.post("/", async (req, res, next) => {
  try {
    const input = favoriteSchema.parse(req.body);
    const favorite = await addFavoriteExercise(getAuthUser(req).id, input.exerciseId);
    res.status(201).json({ data: favorite });
  } catch (error) {
    next(error);
  }
});

favoriteRoutes.delete("/:exerciseId", async (req, res, next) => {
  try {
    await removeFavoriteExercise(getAuthUser(req).id, req.params.exerciseId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
