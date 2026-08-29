import { Request } from "express";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  authUser: AuthUser;
};

export function getAuthUser(req: Request) {
  return (req as unknown as AuthenticatedRequest).authUser;
}
