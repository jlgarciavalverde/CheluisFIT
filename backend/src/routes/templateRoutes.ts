import { Router } from "express";
import { z } from "zod";
import { ExerciseSetType } from "@prisma/client";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  cloneWorkoutTemplate,
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  listWorkoutTemplates,
  startWorkoutFromTemplate,
  updateWorkoutTemplate,
} from "../services/templateService";
import { getAuthUser } from "../types/auth";
import { asNumber } from "../utils/queryHelpers";

export const templateRoutes = Router();

const templateSchema = z.object({
  name: z.string().trim().min(1),
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
              targetWeightKg: z.number().min(0).optional(),
              targetReps: z.number().int().min(1).optional(),
              type: z.nativeEnum(ExerciseSetType).optional(),
              restSeconds: z.number().int().min(0).max(900).optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

templateRoutes.use(requireAuth);

templateRoutes.get("/", async (req, res, next) => {
  try {
    const templates = await listWorkoutTemplates(getAuthUser(req).id, {
      limit: asNumber(req.query.limit),
      offset: asNumber(req.query.offset),
    });
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

templateRoutes.post("/", async (req, res, next) => {
  try {
    const template = await createWorkoutTemplate(
      getAuthUser(req).id,
      templateSchema.parse(req.body),
    );

    res.status(201).json({ data: template });
  } catch (error) {
    next(error);
  }
});

templateRoutes.put("/:templateId", async (req, res, next) => {
  try {
    const template = await updateWorkoutTemplate(
      getAuthUser(req).id,
      req.params.templateId,
      templateSchema.parse(req.body),
    );

    res.json({ data: template });
  } catch (error) {
    next(error);
  }
});

templateRoutes.delete("/:templateId", async (req, res, next) => {
  try {
    await deleteWorkoutTemplate(getAuthUser(req).id, req.params.templateId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

templateRoutes.post("/:templateId/clone", async (req, res, next) => {
  try {
    const template = await cloneWorkoutTemplate(getAuthUser(req).id, req.params.templateId);
    res.status(201).json({ data: template });
  } catch (error) {
    next(error);
  }
});

templateRoutes.post("/:templateId/start", async (req, res, next) => {
  try {
    const session = await startWorkoutFromTemplate(
      getAuthUser(req).id,
      req.params.templateId,
    );

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});
