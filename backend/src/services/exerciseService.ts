import { Exercise, ExerciseSource, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const EXERCISEDB_URL = "https://oss.exercisedb.dev/api/v1/exercises";
const EXTERNAL_CACHE_TTL_MS = 30 * 60 * 1000;
const EXTERNAL_PAGE_SIZE = 25;

type ExerciseLibraryItem = {
  id: string;
  name: string;
  gif: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  instructions: string[];
};

type ExternalExerciseItem = {
  exerciseId?: string;
  id?: string;
  name?: string;
  gifUrl?: string;
  targetMuscles?: string[];
  target?: string;
  bodyParts?: string[];
  bodyPart?: string;
  equipments?: string[];
  equipment?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
};

type ExternalExerciseResponse = {
  success: boolean;
  meta?: {
    total?: number;
    hasNextPage?: boolean;
    nextCursor?: string | null;
  };
  data?: ExternalExerciseItem[];
};

type NormalizedExercise = {
  id: string;
  externalId: string;
  source: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  instructions: string[];
  tips: string[];
};

type ListLocalExercisesParams = {
  q?: string;
  targetMuscle?: string;
  secondaryMuscle?: string;
  bodyPart?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
};

let externalCache:
  | Map<
      string,
      {
        expiresAt: number;
        result: {
          total: number;
          count: number;
          limit: number;
          offset: number;
          data: NormalizedExercise[];
        };
      }
    >
  | undefined;

export function normalizeLocalExercise(exercise: Exercise): NormalizedExercise {
  return {
    id: exercise.id,
    externalId: exercise.externalId,
    source: exercise.source,
    name: exercise.name,
    gifUrl: exercise.gifUrl,
    targetMuscles: exercise.targetMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    bodyParts: exercise.bodyParts,
    equipment: exercise.equipment,
    instructions: exercise.instructions,
    tips: exercise.instructions,
  };
}

export function normalizeExerciseLibraryItem(item: ExerciseLibraryItem) {
  return {
    externalId: item.id,
    source: ExerciseSource.EXERCISE_LIBRARY,
    name: item.name,
    gifUrl: `https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/${item.gif}`,
    targetMuscles: item.targetMuscles,
    secondaryMuscles: item.secondaryMuscles,
    bodyParts: item.bodyParts,
    equipment: item.equipment,
    instructions: item.instructions,
  };
}

export async function listLocalExercises(params: ListLocalExercisesParams) {
  const limit = clamp(params.limit ?? 20, 1, 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const where: Prisma.ExerciseWhereInput = {};
  const filters: Prisma.ExerciseWhereInput[] = [];

  if (params.q) {
    filters.push({
      name: {
        contains: params.q,
        mode: "insensitive",
      },
    });
  }

  if (params.targetMuscle) {
    filters.push({ targetMuscles: { has: params.targetMuscle.toLowerCase() } });
  }

  if (params.secondaryMuscle) {
    filters.push({ secondaryMuscles: { has: params.secondaryMuscle.toLowerCase() } });
  }

  if (params.bodyPart) {
    filters.push({ bodyParts: { has: params.bodyPart.toLowerCase() } });
  }

  if (params.equipment) {
    filters.push({ equipment: { has: params.equipment.toLowerCase() } });
  }

  if (filters.length > 0) {
    where.AND = filters;
  }

  const [total, exercises] = await prisma.$transaction([
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    total,
    count: exercises.length,
    limit,
    offset,
    data: exercises.map(normalizeLocalExercise),
  };
}

export async function getLocalExerciseById(id: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  return exercise ? normalizeLocalExercise(exercise) : null;
}

export async function searchExternalExercises(q: string, limit = 20, offset = 0) {
  const normalizedQuery = q.trim().toLowerCase();
  const normalizedLimit = clamp(limit, 1, EXTERNAL_PAGE_SIZE);
  const normalizedOffset = Math.max(offset, 0);
  const cacheKey = `${normalizedQuery}:${normalizedLimit}:${normalizedOffset}`;
  const cached = externalCache?.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const rawExercises: ExternalExerciseItem[] = [];
  const pagesToRead = Math.max(1, Math.ceil((normalizedOffset + normalizedLimit) / EXTERNAL_PAGE_SIZE));
  let after: string | undefined;
  let total = 0;

  for (let page = 0; page < pagesToRead; page += 1) {
    const payload = await fetchExternalExercisesPage(normalizedQuery, after);
    rawExercises.push(...(payload.data ?? []));
    total = payload.meta?.total ?? rawExercises.length;

    const nextCursor = payload.meta?.nextCursor ?? undefined;

    if (!payload.meta?.hasNextPage || !nextCursor || nextCursor === after) {
      break;
    }

    after = nextCursor;
  }

  const data = rawExercises
    .slice(normalizedOffset, normalizedOffset + normalizedLimit)
    .map(normalizeExternalExercise)
    .filter(Boolean) as NormalizedExercise[];

  const result = {
    total,
    count: data.length,
    limit: normalizedLimit,
    offset: normalizedOffset,
    data,
  };

  if (!externalCache) {
    externalCache = new Map();
  }

  externalCache.set(cacheKey, {
    expiresAt: Date.now() + EXTERNAL_CACHE_TTL_MS,
    result,
  });

  return result;
}

async function fetchExternalExercisesPage(q: string, after?: string) {
  const url = new URL(EXERCISEDB_URL);
  url.searchParams.set("limit", EXTERNAL_PAGE_SIZE.toString());

  if (q) {
    url.searchParams.set("name", q);
  }

  if (after) {
    url.searchParams.set("after", after);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ExerciseDB request failed with status ${response.status}`);
  }

  return (await response.json()) as ExternalExerciseResponse;
}

function normalizeExternalExercise(item: ExternalExerciseItem): NormalizedExercise | null {
  const externalId = item.exerciseId ?? item.id;

  if (!externalId || !item.name) {
    return null;
  }

  const targetMuscles = item.targetMuscles ?? (item.target ? [item.target] : []);
  const bodyParts = item.bodyParts ?? (item.bodyPart ? [item.bodyPart] : []);
  const equipment = item.equipments ?? (item.equipment ? [item.equipment] : []);
  const instructions = item.instructions ?? [];

  return {
    id: externalId,
    externalId,
    source: "EXERCISEDB",
    name: item.name,
    gifUrl: item.gifUrl ?? "",
    targetMuscles,
    secondaryMuscles: item.secondaryMuscles ?? [],
    bodyParts,
    equipment,
    instructions,
    tips: instructions,
  };
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
