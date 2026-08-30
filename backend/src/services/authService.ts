import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { getRefreshTokenTtlMs, signJwt } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

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

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new HttpError(429, `Cuenta bloqueada. Intenta en ${minutesLeft} minutos.`);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    const lockout = attempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: lockout,
      },
    });

    throw new HttpError(401, "Invalid email or password");
  }

  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  return createAuthResponse(user);
}

export async function refreshAccessToken(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  return createAuthResponse(stored.user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(401, "Current password is incorrect");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function revokeRefreshTokens(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
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
  const token = randomBytes(32).toString("base64url");

  await prisma.refreshToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + getRefreshTokenTtlMs()),
    },
  });

  return {
    token: await signJwt({ sub: user.id, email: user.email }),
    refreshToken: token,
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
