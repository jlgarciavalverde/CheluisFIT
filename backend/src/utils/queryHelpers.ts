import { prisma } from "../lib/prisma";
import { HttpError } from "./httpError";

export function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function asNumber(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export async function ensureExercisesExist(exerciseIds: string[]) {
  const uniqueExerciseIds = Array.from(new Set(exerciseIds));
  const count = await prisma.exercise.count({
    where: { id: { in: uniqueExerciseIds } },
  });

  if (count !== uniqueExerciseIds.length) {
    throw new HttpError(404, "One or more exercises were not found");
  }
}
