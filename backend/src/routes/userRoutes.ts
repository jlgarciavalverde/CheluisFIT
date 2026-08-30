import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { listWorkoutSessions } from "../services/workoutService";
import { getAuthUser } from "../types/auth";
import { asNumber } from "../utils/queryHelpers";

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get("/:userId/workout-sessions", async (req, res, next) => {
  try {
    if (req.params.userId !== getAuthUser(req).id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const sessions = await listWorkoutSessions({
      userId: req.params.userId,
      limit: asNumber(req.query.limit),
      offset: asNumber(req.query.offset),
    });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});
