import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { signJwt } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

type RegisterInput = {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  birthDate: Date;
  currentWeightKg: number;
  currentHeightCm: number;
  email: string;
  password: string;
};

export async function registerUser(input: RegisterInput) {
  try {
    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName1: input.lastName1,
        lastName2: input.lastName2,
        birthDate: input.birthDate,
        currentWeightKg: input.currentWeightKg,
        currentHeightCm: input.currentHeightCm,
        email: normalizeEmail(input.email),
        passwordHash: await hashPassword(input.password),
      },
    });

    return createAuthResponse(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Email already registered");
    }

    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  return createAuthResponse(user);
}

async function createAuthResponse(user: {
  id: string;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  birthDate: Date;
  currentWeightKg: number;
  currentHeightCm: number;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    token: await signJwt({ sub: user.id, email: user.email }),
    user: sanitizeUser(user),
  };
}

export function sanitizeUser(user: {
  id: string;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  birthDate: Date;
  currentWeightKg: number;
  currentHeightCm: number;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName1: user.lastName1,
    lastName2: user.lastName2,
    birthDate: user.birthDate.toISOString(),
    currentWeightKg: user.currentWeightKg,
    currentHeightCm: user.currentHeightCm,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
