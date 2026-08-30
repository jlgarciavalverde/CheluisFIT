import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { clamp } from "../utils/queryHelpers";
import { normalizeLocalExercise } from "./exerciseService";

export async function listFavoriteExercises(
  userId: string,
  params?: { limit?: number; offset?: number },
) {
  const limit = clamp(params?.limit ?? 50, 1, 100);
  const offset = Math.max(params?.offset ?? 0, 0);
  const where = { userId };

  const [total, favorites] = await prisma.$transaction([
    prisma.favoriteExercise.count({ where }),
    prisma.favoriteExercise.findMany({
      where,
      include: { exercise: true },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    total,
    count: favorites.length,
    limit,
    offset,
    data: favorites.map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt.toISOString(),
      exercise: normalizeLocalExercise(favorite.exercise),
    })),
  };
}

export async function addFavoriteExercise(userId: string, exerciseId: string) {
  await ensureExerciseExists(exerciseId);

  try {
    const favorite = await prisma.favoriteExercise.create({
      data: { userId, exerciseId },
      include: { exercise: true },
    });

    return {
      id: favorite.id,
      createdAt: favorite.createdAt.toISOString(),
      exercise: normalizeLocalExercise(favorite.exercise),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Exercise already marked as favorite");
    }

    throw error;
  }
}

export async function removeFavoriteExercise(userId: string, exerciseId: string) {
  await prisma.favoriteExercise.deleteMany({
    where: { userId, exerciseId },
  });
}

async function ensureExerciseExists(exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  });

  if (!exercise) {
    throw new HttpError(404, "Exercise not found");
  }
}
