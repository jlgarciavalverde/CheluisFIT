import { ExerciseSetType, Prisma, WorkoutSessionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { computeProgressMetrics } from "../utils/progressMetrics";
import { clamp, ensureExercisesExist } from "../utils/queryHelpers";

type CreateWorkoutSessionInput = {
  performedAt?: Date;
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    order?: number;
    notes?: string;
    sets: Array<{
      setNumber?: number;
      weightKg: number;
      reps: number;
      type?: ExerciseSetType;
      restSeconds?: number;
      completedAt?: Date | null;
    }>;
  }>;
};

type UpdateWorkoutSessionInput = {
  performedAt?: Date;
  notes?: string | null;
  status?: WorkoutSessionStatus;
  completedAt?: Date | null;
};

type UpdateExerciseSetInput = {
  setNumber?: number;
  weightKg?: number;
  reps?: number;
  type?: ExerciseSetType;
  restSeconds?: number;
  completed?: boolean;
};

type AddWorkoutExerciseInput = {
  exerciseId: string;
  notes?: string;
  sets: Array<{
    weightKg: number;
    reps: number;
    type?: ExerciseSetType;
    restSeconds?: number;
  }>;
};

type AddWorkoutSetInput = {
  weightKg: number;
  reps: number;
  type?: ExerciseSetType;
  restSeconds?: number;
};

type ListWorkoutSessionsParams = {
  userId: string;
  limit?: number;
  offset?: number;
};

export async function createWorkoutSession(
  userId: string,
  input: CreateWorkoutSessionInput,
  status: WorkoutSessionStatus = WorkoutSessionStatus.COMPLETED,
) {
  await ensureExercisesExist(input.exercises.map((exercise) => exercise.exerciseId));

  const performedAt = input.performedAt ?? new Date();

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      performedAt,
      startedAt: performedAt,
      completedAt: status === WorkoutSessionStatus.COMPLETED ? performedAt : null,
      status,
      notes: input.notes,
      exercises: {
        create: input.exercises.map((exercise, exerciseIndex) => ({
          exerciseId: exercise.exerciseId,
          order: exercise.order ?? exerciseIndex + 1,
          notes: exercise.notes,
          sets: {
            create: exercise.sets.map((set, setIndex) => ({
              setNumber: set.setNumber ?? setIndex + 1,
              weightKg: set.weightKg,
              reps: set.reps,
              type: set.type ?? ExerciseSetType.NORMAL,
              restSeconds: set.restSeconds ?? 90,
              completedAt:
                set.completedAt === undefined
                  ? status === WorkoutSessionStatus.COMPLETED
                    ? performedAt
                    : null
                  : set.completedAt,
            })),
          },
        })),
      },
    },
    include: workoutSessionInclude,
  });

  return normalizeWorkoutSession(session);
}

export async function startWorkoutSession(userId: string, input: CreateWorkoutSessionInput) {
  await ensureNoActiveWorkoutSession(userId);
  return createWorkoutSession(userId, input, WorkoutSessionStatus.IN_PROGRESS);
}

export async function getActiveWorkoutSession(userId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { userId, status: WorkoutSessionStatus.IN_PROGRESS },
    include: workoutSessionInclude,
    orderBy: { startedAt: "desc" },
  });

  return { data: session ? normalizeWorkoutSession(session) : null };
}

export async function listWorkoutSessions(params: ListWorkoutSessionsParams) {
  const limit = clamp(params.limit ?? 20, 1, 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const where = { userId: params.userId };

  const [total, sessions] = await prisma.$transaction([
    prisma.workoutSession.count({ where }),
    prisma.workoutSession.findMany({
      where,
      include: workoutSessionInclude,
      orderBy: { performedAt: "desc" },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    total,
    count: sessions.length,
    limit,
    offset,
    data: sessions.map(normalizeWorkoutSession),
  };
}

export async function updateWorkoutSession(
  userId: string,
  sessionId: string,
  input: UpdateWorkoutSessionInput,
) {
  await ensureWorkoutSessionOwnership(userId, sessionId);

  const data: Prisma.WorkoutSessionUpdateInput = {};

  if (input.performedAt !== undefined) data.performedAt = input.performedAt;
  if (input.notes !== undefined) data.notes = input.notes;

  if (input.status !== undefined) {
    data.status = input.status;
    data.completedAt =
      input.status === WorkoutSessionStatus.COMPLETED
        ? input.completedAt ?? new Date()
        : null;
  } else if (input.completedAt !== undefined) {
    data.completedAt = input.completedAt;
  }

  const session = await prisma.workoutSession.update({
    where: { id: sessionId },
    data,
    include: workoutSessionInclude,
  });

  return normalizeWorkoutSession(session);
}

export async function getWorkoutSession(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: workoutSessionInclude,
  });

  if (!session) {
    throw new HttpError(404, "Workout session not found");
  }

  return normalizeWorkoutSession(session);
}

export async function deleteWorkoutSession(userId: string, sessionId: string) {
  await ensureWorkoutSessionOwnership(userId, sessionId);
  await prisma.workoutSession.delete({ where: { id: sessionId } });
}

export async function removeWorkoutExercise(
  userId: string,
  sessionId: string,
  workoutExerciseId: string,
) {
  await ensureActiveWorkoutSessionOwnership(userId, sessionId);

  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workoutSessionId: sessionId },
    select: { id: true },
  });

  if (!workoutExercise) {
    throw new HttpError(404, "Workout exercise not found");
  }

  await prisma.workoutExercise.delete({ where: { id: workoutExerciseId } });
  return getWorkoutSession(userId, sessionId);
}

export async function removeWorkoutSet(
  userId: string,
  sessionId: string,
  setId: string,
) {
  await ensureActiveWorkoutSessionOwnership(userId, sessionId);

  const set = await prisma.exerciseSet.findFirst({
    where: {
      id: setId,
      workoutExercise: { workoutSessionId: sessionId },
    },
    select: { id: true },
  });

  if (!set) {
    throw new HttpError(404, "Exercise set not found");
  }

  await prisma.exerciseSet.delete({ where: { id: setId } });
  return getWorkoutSession(userId, sessionId);
}

export async function addWorkoutExercise(
  userId: string,
  sessionId: string,
  input: AddWorkoutExerciseInput,
) {
  await ensureActiveWorkoutSessionOwnership(userId, sessionId);
  await ensureExercisesExist([input.exerciseId]);

  const lastExercise = await prisma.workoutExercise.findFirst({
    where: { workoutSessionId: sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.workoutExercise.create({
    data: {
      workoutSessionId: sessionId,
      exerciseId: input.exerciseId,
      order: (lastExercise?.order ?? 0) + 1,
      notes: input.notes,
      sets: {
        create: input.sets.map((set, index) => ({
          setNumber: index + 1,
          weightKg: set.weightKg,
          reps: set.reps,
          type: set.type ?? ExerciseSetType.NORMAL,
          restSeconds: set.restSeconds ?? 90,
        })),
      },
    },
  });

  return getWorkoutSessionForUser(userId, sessionId);
}

export async function addWorkoutSet(
  userId: string,
  sessionId: string,
  workoutExerciseId: string,
  input: AddWorkoutSetInput,
) {
  await ensureActiveWorkoutSessionOwnership(userId, sessionId);

  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workoutSessionId: sessionId },
    include: {
      sets: {
        orderBy: { setNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!workoutExercise) {
    throw new HttpError(404, "Workout exercise not found");
  }

  const lastSet = workoutExercise.sets[0];

  await prisma.exerciseSet.create({
    data: {
      workoutExerciseId,
      setNumber: (lastSet?.setNumber ?? 0) + 1,
      weightKg: input.weightKg,
      reps: input.reps,
      type: input.type ?? ExerciseSetType.NORMAL,
      restSeconds: input.restSeconds ?? lastSet?.restSeconds ?? 90,
    },
  });

  return getWorkoutSessionForUser(userId, sessionId);
}

export async function updateWorkoutSet(
  userId: string,
  sessionId: string,
  setId: string,
  input: UpdateExerciseSetInput,
) {
  await ensureActiveWorkoutSessionOwnership(userId, sessionId);

  const currentSet = await prisma.exerciseSet.findFirst({
    where: {
      id: setId,
      workoutExercise: {
        workoutSessionId: sessionId,
      },
    },
    select: { id: true },
  });

  if (!currentSet) {
    throw new HttpError(404, "Exercise set not found");
  }

  const data: Prisma.ExerciseSetUpdateInput = {};

  if (input.setNumber !== undefined) data.setNumber = input.setNumber;
  if (input.weightKg !== undefined) data.weightKg = input.weightKg;
  if (input.reps !== undefined) data.reps = input.reps;
  if (input.type !== undefined) data.type = input.type;
  if (input.restSeconds !== undefined) data.restSeconds = input.restSeconds;
  if (input.completed !== undefined) data.completedAt = input.completed ? new Date() : null;

  const set = await prisma.exerciseSet.update({
    where: { id: setId },
    data,
  });

  return normalizeExerciseSet(set);
}

async function getWorkoutSessionForUser(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: workoutSessionInclude,
  });

  if (!session) {
    throw new HttpError(404, "Workout session not found");
  }

  return normalizeWorkoutSession(session);
}

export async function getExerciseProgress(userId: string, exerciseId: string) {
  await ensureExercisesExist([exerciseId]);

  const workoutExercises = await prisma.workoutExercise.findMany({
    where: {
      exerciseId,
      workoutSession: {
        userId,
      },
    },
    include: {
      workoutSession: true,
      sets: {
        orderBy: { setNumber: "asc" },
      },
    },
    orderBy: [
      {
        workoutSession: {
          performedAt: "asc",
        },
      },
      { order: "asc" },
    ],
  });

  return {
    userId,
    exerciseId,
    data: computeProgressMetrics(
      workoutExercises.map((workoutExercise) => ({
        performedAt: workoutExercise.workoutSession.performedAt,
        sessionId: workoutExercise.workoutSessionId,
        sets: workoutExercise.sets,
      })),
    ),
  };
}

export async function getExerciseProgression(userId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    throw new HttpError(404, "Exercise not found");
  }

  const lastWorkoutExercise = await prisma.workoutExercise.findFirst({
    where: {
      exerciseId,
      workoutSession: {
        userId,
        status: WorkoutSessionStatus.COMPLETED,
      },
    },
    include: {
      workoutSession: true,
      sets: {
        orderBy: { setNumber: "asc" },
      },
    },
    orderBy: {
      workoutSession: {
        performedAt: "desc",
      },
    },
  });

  const effectiveSets =
    lastWorkoutExercise?.sets.filter((set) => set.type !== ExerciseSetType.WARMUP) ?? [];

  if (!lastWorkoutExercise || effectiveSets.length === 0) {
    return {
      userId,
      exerciseId,
      data: {
        status: "NO_HISTORY",
        suggestion: null,
        message: "Sin historial para este ejercicio.",
      },
    };
  }

  const targetReps = 10;
  const resetReps = 8;
  const bodyweight = exercise.equipment.some((equipment) =>
    equipment.toLowerCase().includes("body weight"),
  );
  const incrementKg = bodyweight ? 0 : getProgressionIncrementKg(exercise.bodyParts);
  const allSetsHitTarget = effectiveSets.every((set) => set.reps >= targetReps);
  const maxWeightKg = Math.max(...effectiveSets.map((set) => set.weightKg));

  const suggestedSets = effectiveSets.map((set) => ({
    setNumber: set.setNumber,
    weightKg: allSetsHitTarget && !bodyweight ? set.weightKg + incrementKg : set.weightKg,
    reps:
      allSetsHitTarget && !bodyweight
        ? resetReps
        : Math.min(set.reps + (bodyweight ? 2 : 1), targetReps),
    type: set.type,
    restSeconds: set.restSeconds,
  }));

  return {
    userId,
    exerciseId,
    data: {
      status: allSetsHitTarget && !bodyweight ? "INCREASE_LOAD" : "INCREASE_REPS",
      lastPerformedAt: lastWorkoutExercise.workoutSession.performedAt.toISOString(),
      current: {
        maxWeightKg,
        totalSets: effectiveSets.length,
        targetReps,
      },
      suggestion: {
        incrementKg,
        sets: suggestedSets,
      },
      message: allSetsHitTarget
        ? bodyweight
          ? "Reps objetivo alcanzadas: sube reps manteniendo peso corporal."
          : `Reps objetivo alcanzadas: prueba subir ${incrementKg} kg.`
        : "Mantiene el peso y apunta a una rep mas por serie.",
    },
  };
}

export async function getExerciseRecords(userId: string, exerciseId: string) {
  const progress = await getExerciseProgress(userId, exerciseId);
  const lastEntry = progress.data.at(-1) ?? null;
  const bestWeightEntry = progress.data.reduce<(typeof progress.data)[number] | null>(
    (best, entry) => (!best || entry.maxWeightKg > best.maxWeightKg ? entry : best),
    null,
  );
  const bestVolumeEntry = progress.data.reduce<(typeof progress.data)[number] | null>(
    (best, entry) => (!best || entry.totalVolumeKg > best.totalVolumeKg ? entry : best),
    null,
  );

  return {
    userId,
    exerciseId,
    bestWeight: bestWeightEntry
      ? {
          weightKg: bestWeightEntry.maxWeightKg,
          reps: bestWeightEntry.maxRepsAtMaxWeight,
          performedAt: bestWeightEntry.performedAt,
          sessionId: bestWeightEntry.sessionId,
        }
      : null,
    bestVolume: bestVolumeEntry
      ? {
          volumeKg: bestVolumeEntry.totalVolumeKg,
          performedAt: bestVolumeEntry.performedAt,
          sessionId: bestVolumeEntry.sessionId,
        }
      : null,
    lastEntry,
  };
}

const workoutSessionInclude = {
  exercises: {
    include: {
      exercise: true,
      sets: {
        orderBy: { setNumber: "asc" },
      },
    },
    orderBy: { order: "asc" },
  },
} satisfies Prisma.WorkoutSessionInclude;

type WorkoutSessionWithRelations = Prisma.WorkoutSessionGetPayload<{
  include: typeof workoutSessionInclude;
}>;

function normalizeWorkoutSession(session: WorkoutSessionWithRelations) {
  return {
    id: session.id,
    userId: session.userId,
    performedAt: session.performedAt.toISOString(),
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    notes: session.notes,
    exercises: session.exercises.map((workoutExercise) => ({
      id: workoutExercise.id,
      exerciseId: workoutExercise.exerciseId,
      order: workoutExercise.order,
      notes: workoutExercise.notes,
      exercise: {
        id: workoutExercise.exercise.id,
        name: workoutExercise.exercise.name,
        gifUrl: workoutExercise.exercise.gifUrl,
        targetMuscles: workoutExercise.exercise.targetMuscles,
        secondaryMuscles: workoutExercise.exercise.secondaryMuscles,
        bodyParts: workoutExercise.exercise.bodyParts,
        equipment: workoutExercise.exercise.equipment,
      },
      sets: workoutExercise.sets.map(normalizeExerciseSet),
    })),
    muscleSummary: computeMuscleSummary(session),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function normalizeExerciseSet(set: {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  type: ExerciseSetType;
  restSeconds: number;
  completedAt: Date | null;
}) {
  return {
    id: set.id,
    setNumber: set.setNumber,
    weightKg: set.weightKg,
    reps: set.reps,
    type: set.type,
    restSeconds: set.restSeconds,
    completedAt: set.completedAt?.toISOString() ?? null,
  };
}

function computeMuscleSummary(session: WorkoutSessionWithRelations) {
  const summary = new Map<string, { muscle: string; effectiveSets: number; recommendedMin: number; recommendedMax: number }>();

  for (const workoutExercise of session.exercises) {
    const effectiveSetCount = workoutExercise.sets.filter(
      (set) => set.type !== ExerciseSetType.WARMUP,
    ).length;

    for (const muscle of workoutExercise.exercise.targetMuscles) {
      addMuscleSets(summary, muscle, effectiveSetCount);
    }

    for (const muscle of workoutExercise.exercise.secondaryMuscles) {
      addMuscleSets(summary, muscle, effectiveSetCount * 0.5);
    }
  }

  return Array.from(summary.values()).sort((a, b) => b.effectiveSets - a.effectiveSets);
}

function addMuscleSets(
  summary: Map<string, { muscle: string; effectiveSets: number; recommendedMin: number; recommendedMax: number }>,
  muscle: string,
  value: number,
) {
  const key = muscle.toLowerCase();
  const current =
    summary.get(key) ??
    {
      muscle,
      effectiveSets: 0,
      recommendedMin: 4,
      recommendedMax: 6,
    };

  current.effectiveSets += value;
  summary.set(key, current);
}

async function ensureNoActiveWorkoutSession(userId: string) {
  const activeSession = await prisma.workoutSession.findFirst({
    where: { userId, status: WorkoutSessionStatus.IN_PROGRESS },
    select: { id: true },
  });

  if (activeSession) {
    throw new HttpError(409, "There is already an active workout session");
  }
}

async function ensureWorkoutSessionOwnership(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!session) {
    throw new HttpError(404, "Workout session not found");
  }
}

async function ensureActiveWorkoutSessionOwnership(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, status: true },
  });

  if (!session) {
    throw new HttpError(404, "Workout session not found");
  }

  if (session.status !== WorkoutSessionStatus.IN_PROGRESS) {
    throw new HttpError(409, "Workout session is already completed");
  }
}

function getProgressionIncrementKg(bodyParts: string[]) {
  const lowerBodyParts = new Set(["upper legs", "lower legs", "legs"]);
  return bodyParts.some((bodyPart) => lowerBodyParts.has(bodyPart.toLowerCase())) ? 5 : 2.5;
}

