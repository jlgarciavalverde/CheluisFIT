import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { getDashboard } from "../services/dashboardService";
import { getAuthUser } from "../types/auth";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get("/", async (req, res, next) => {
  try {
    const dashboard = await getDashboard(getAuthUser(req).id);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});
