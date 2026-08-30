import { ExerciseSetType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { clamp, ensureExercisesExist } from "../utils/queryHelpers";
import { startWorkoutSession } from "./workoutService";

type TemplateExerciseInput = {
  exerciseId: string;
  order?: number;
  notes?: string;
  sets: Array<{
    setNumber?: number;
    targetWeightKg?: number;
    targetReps?: number;
    type?: ExerciseSetType;
    restSeconds?: number;
  }>;
};

type TemplateInput = {
  name: string;
  notes?: string;
  exercises: TemplateExerciseInput[];
};

export async function createWorkoutTemplate(userId: string, input: TemplateInput) {
  await ensureExercisesExist(input.exercises.map((exercise) => exercise.exerciseId));

  const template = await prisma.workoutTemplate.create({
    data: {
      userId,
      name: input.name,
      notes: input.notes,
      exercises: createTemplateExercises(input.exercises),
    },
    include: workoutTemplateInclude,
  });

  return normalizeWorkoutTemplate(template);
}

export async function listWorkoutTemplates(
  userId: string,
  params?: { limit?: number; offset?: number },
) {
  const limit = clamp(params?.limit ?? 50, 1, 100);
  const offset = Math.max(params?.offset ?? 0, 0);
  const where = { userId };

  const [total, templates] = await prisma.$transaction([
    prisma.workoutTemplate.count({ where }),
    prisma.workoutTemplate.findMany({
      where,
      include: workoutTemplateInclude,
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    total,
    count: templates.length,
    limit,
    offset,
    data: templates.map(normalizeWorkoutTemplate),
  };
}

export async function updateWorkoutTemplate(userId: string, templateId: string, input: TemplateInput) {
  await ensureTemplateOwnership(userId, templateId);
  await ensureExercisesExist(input.exercises.map((exercise) => exercise.exerciseId));

  const template = await prisma.workoutTemplate.update({
    where: { id: templateId },
    data: {
      name: input.name,
      notes: input.notes,
      exercises: {
        deleteMany: {},
        ...createTemplateExercises(input.exercises),
      },
    },
    include: workoutTemplateInclude,
  });

  return normalizeWorkoutTemplate(template);
}

export async function deleteWorkoutTemplate(userId: string, templateId: string) {
  await ensureTemplateOwnership(userId, templateId);
  await prisma.workoutTemplate.delete({ where: { id: templateId } });
}

export async function cloneWorkoutTemplate(userId: string, templateId: string) {
  await ensureTemplateOwnership(userId, templateId);

  const template = await prisma.workoutTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: workoutTemplateInclude,
  });

  return createWorkoutTemplate(userId, {
    name: `${template.name} copia`,
    notes: template.notes ?? undefined,
    exercises: template.exercises.map((templateExercise) => ({
      exerciseId: templateExercise.exerciseId,
      order: templateExercise.order,
      notes: templateExercise.notes ?? undefined,
      sets: templateExercise.sets.map((set) => ({
        setNumber: set.setNumber,
        targetWeightKg: set.targetWeightKg ?? undefined,
        targetReps: set.targetReps ?? undefined,
        type: set.type,
        restSeconds: set.restSeconds,
      })),
    })),
  });
}

export async function startWorkoutFromTemplate(userId: string, templateId: string) {
  await ensureTemplateOwnership(userId, templateId);

  const template = await prisma.workoutTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: workoutTemplateInclude,
  });

  return startWorkoutSession(userId, {
    notes: `Started from routine: ${template.name}`,
    exercises: template.exercises.map((templateExercise) => ({
      exerciseId: templateExercise.exerciseId,
      order: templateExercise.order,
      notes: templateExercise.notes ?? undefined,
      sets: templateExercise.sets.map((set) => ({
        setNumber: set.setNumber,
        weightKg: set.targetWeightKg ?? 0,
        reps: set.targetReps ?? 1,
        type: set.type,
        restSeconds: set.restSeconds,
      })),
    })),
  });
}

const workoutTemplateInclude = {
  exercises: {
    include: {
      exercise: true,
      sets: {
        orderBy: { setNumber: "asc" },
      },
    },
    orderBy: { order: "asc" },
  },
} satisfies Prisma.WorkoutTemplateInclude;

type WorkoutTemplateWithRelations = Prisma.WorkoutTemplateGetPayload<{
  include: typeof workoutTemplateInclude;
}>;

function createTemplateExercises(exercises: TemplateExerciseInput[]) {
  return {
    create: exercises.map((exercise, exerciseIndex) => ({
      exerciseId: exercise.exerciseId,
      order: exercise.order ?? exerciseIndex + 1,
      notes: exercise.notes,
      sets: {
        create: exercise.sets.map((set, setIndex) => ({
          setNumber: set.setNumber ?? setIndex + 1,
          targetWeightKg: set.targetWeightKg,
          targetReps: set.targetReps,
          type: set.type ?? ExerciseSetType.NORMAL,
          restSeconds: set.restSeconds ?? 90,
        })),
      },
    })),
  };
}

function normalizeWorkoutTemplate(template: WorkoutTemplateWithRelations) {
  return {
    id: template.id,
    userId: template.userId,
    name: template.name,
    notes: template.notes,
    exercises: template.exercises.map((templateExercise) => ({
      id: templateExercise.id,
      exerciseId: templateExercise.exerciseId,
      order: templateExercise.order,
      notes: templateExercise.notes,
      exercise: {
        id: templateExercise.exercise.id,
        name: templateExercise.exercise.name,
        gifUrl: templateExercise.exercise.gifUrl,
        targetMuscles: templateExercise.exercise.targetMuscles,
        secondaryMuscles: templateExercise.exercise.secondaryMuscles,
        bodyParts: templateExercise.exercise.bodyParts,
        equipment: templateExercise.exercise.equipment,
      },
      sets: templateExercise.sets.map((set) => ({
        id: set.id,
        setNumber: set.setNumber,
        targetWeightKg: set.targetWeightKg,
        targetReps: set.targetReps,
        type: set.type,
        restSeconds: set.restSeconds,
      })),
    })),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

async function ensureTemplateOwnership(userId: string, templateId: string) {
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, userId },
    select: { id: true },
  });

  if (!template) {
    throw new HttpError(404, "Workout template not found");
  }
}

