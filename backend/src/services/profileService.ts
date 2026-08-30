import { MeasurementUnits, Prisma, TrainingGoal } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sanitizeUser } from "./authService";

type UpdateProfileInput = {
  firstName?: string;
  lastName1?: string;
  lastName2?: string | null;
  birthDate?: Date;
  currentWeightKg?: number;
  currentHeightCm?: number;
};

type UpdateTrainingPreferenceInput = {
  defaultRestSeconds?: number;
  weeklyFrequency?: number;
  goal?: TrainingGoal;
  units?: MeasurementUnits;
};

export async function getProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  return sanitizeUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: Prisma.UserUpdateInput = {};

  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName1 !== undefined) data.lastName1 = input.lastName1;
  if (input.lastName2 !== undefined) data.lastName2 = input.lastName2;
  if (input.birthDate !== undefined) data.birthDate = input.birthDate;
  if (input.currentWeightKg !== undefined) data.currentWeightKg = input.currentWeightKg;
  if (input.currentHeightCm !== undefined) data.currentHeightCm = input.currentHeightCm;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return sanitizeUser(user);
}

export async function listBodyMeasurements(userId: string) {
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: { measuredAt: "asc" },
  });

  return {
    data: measurements.map((measurement) => ({
      id: measurement.id,
      userId: measurement.userId,
      weightKg: measurement.weightKg,
      heightCm: measurement.heightCm,
      measuredAt: measurement.measuredAt.toISOString(),
    })),
  };
}

export async function addBodyMeasurement(
  userId: string,
  input: { weightKg: number; heightCm: number; measuredAt?: Date },
) {
  const [measurement] = await prisma.$transaction([
    prisma.bodyMeasurement.create({
      data: {
        userId,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        measuredAt: input.measuredAt ?? new Date(),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        currentWeightKg: input.weightKg,
        currentHeightCm: input.heightCm,
      },
    }),
  ]);

  return {
    id: measurement.id,
    userId: measurement.userId,
    weightKg: measurement.weightKg,
    heightCm: measurement.heightCm,
    measuredAt: measurement.measuredAt.toISOString(),
  };
}

export async function getTrainingPreference(userId: string) {
  const preference = await prisma.userTrainingPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return { data: normalizeTrainingPreference(preference) };
}

export async function updateTrainingPreference(
  userId: string,
  input: UpdateTrainingPreferenceInput,
) {
  const preference = await prisma.userTrainingPreference.upsert({
    where: { userId },
    create: {
      userId,
      defaultRestSeconds: input.defaultRestSeconds,
      weeklyFrequency: input.weeklyFrequency,
      goal: input.goal,
      units: input.units,
    },
    update: {
      defaultRestSeconds: input.defaultRestSeconds,
      weeklyFrequency: input.weeklyFrequency,
      goal: input.goal,
      units: input.units,
    },
  });

  return { data: normalizeTrainingPreference(preference) };
}

function normalizeTrainingPreference(preference: {
  id: string;
  userId: string;
  defaultRestSeconds: number;
  weeklyFrequency: number;
  goal: TrainingGoal;
  units: MeasurementUnits;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: preference.id,
    userId: preference.userId,
    defaultRestSeconds: preference.defaultRestSeconds,
    weeklyFrequency: preference.weeklyFrequency,
    goal: preference.goal,
    units: preference.units,
    createdAt: preference.createdAt.toISOString(),
    updatedAt: preference.updatedAt.toISOString(),
  };
}
