import { Router } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/authService";

export const authRoutes = Router();

const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName1: z.string().trim().min(1),
  lastName2: z.string().trim().min(1).optional(),
  birthDate: z.coerce.date(),
  currentWeightKg: z.number().positive(),
  currentHeightCm: z.number().int().positive(),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

authRoutes.post("/register", async (req, res, next) => {
  try {
    const result = await registerUser(registerSchema.parse(req.body));
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input.email, input.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
