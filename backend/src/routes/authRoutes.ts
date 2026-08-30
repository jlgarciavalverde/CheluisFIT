import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  changePassword,
  loginUser,
  refreshAccessToken,
  registerUser,
  revokeRefreshTokens,
} from "../services/authService";
import { AuthenticatedRequest } from "../types/auth";

export const authRoutes = Router();

const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName1: z.string().trim().min(1),
  lastName2: z.string().trim().min(1).optional(),
  birthDate: z.coerce.date(),
  currentWeightKg: z.number().positive(),
  currentHeightCm: z.number().int().positive(),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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

authRoutes.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).authUser.id;
    await changePassword(userId, currentPassword, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).authUser.id;
    await revokeRefreshTokens(userId);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});
