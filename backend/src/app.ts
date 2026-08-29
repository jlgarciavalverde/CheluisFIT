import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { authRoutes } from "./routes/authRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";
import { exerciseRoutes } from "./routes/exerciseRoutes";
import { favoriteRoutes } from "./routes/favoriteRoutes";
import { profileRoutes } from "./routes/profileRoutes";
import { templateRoutes } from "./routes/templateRoutes";
import { userRoutes } from "./routes/userRoutes";
import { workoutSessionRoutes } from "./routes/workoutSessionRoutes";
import { HttpError } from "./utils/httpError";

const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors({ origin: validateCorsOrigin }));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "100kb" }));

const generalLimiter = rateLimit({
  windowMs: minutes(15),
  limit: readNumberEnv("RATE_LIMIT_GENERAL_MAX", 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
});

const authLimiter = rateLimit({
  windowMs: minutes(15),
  limit: readNumberEnv("RATE_LIMIT_AUTH_MAX", 20),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
});

app.use("/api", generalLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/me", profileRoutes);
app.use("/api/me/dashboard", dashboardRoutes);
app.use("/api/favorite-exercises", favoriteRoutes);
app.use("/api/workout-templates", templateRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workout-sessions", workoutSessionRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request",
        issues: error.issues,
      });
      return;
    }

    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    res.status(500).json({
      error:
        isProduction || !(error instanceof Error) ? "Internal server error" : error.message,
    });
  },
);

function validateCorsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, origin?: boolean) => void,
) {
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  callback(new HttpError(403, "Origin not allowed"));
}

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN ?? process.env.CORS_ALLOWED_ORIGINS ?? "";
  const fallbackOrigins = isProduction
    ? []
    : [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

  const origins = raw ? raw.split(",") : fallbackOrigins;

  return new Set(origins.map((origin) => origin.trim()).filter(Boolean));
}

function readNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function minutes(value: number) {
  return value * 60 * 1000;
}
