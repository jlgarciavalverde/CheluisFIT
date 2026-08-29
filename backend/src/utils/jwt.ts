import { SignJWT, jwtVerify } from "jose";

const TOKEN_TTL = process.env.JWT_TTL ?? "7d";

type JwtPayload = {
  sub: string;
  email: string;
  exp?: number;
};

export async function signJwt(payload: Omit<JwtPayload, "exp">) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getJwtSecret());
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
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
