import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_TTL = process.env.JWT_TTL ?? "15m";
const REFRESH_TOKEN_TTL_DAYS = 7;

type JwtPayload = {
  sub: string;
  email: string;
  exp?: number;
};

export function getRefreshTokenTtlMs() {
  return REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export async function signJwt(payload: Omit<JwtPayload, "exp">) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer("cheluisfit")
    .setAudience("cheluisfit-api")
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getJwtSecret());
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "cheluisfit",
      audience: "cheluisfit-api",
    });
    const email = typeof payload.email === "string" ? payload.email : null;

    if (!payload.sub || !email) {
      return null;
    }

    return {
      sub: payload.sub,
      email,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return new TextEncoder().encode("cheluisfit-local-development-secret-change-me");
}
