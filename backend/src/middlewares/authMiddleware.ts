import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, AuthUser } from "../types/auth";
import { verifyJwt } from "../utils/jwt";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  });

  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  (req as AuthenticatedRequest).authUser = user satisfies AuthUser;
  next();
}

function getBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}
