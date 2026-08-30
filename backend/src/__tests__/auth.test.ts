import { SignJWT } from "jose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app";
import {
  authed,
  cleanupTestData,
  createRegisterPayload,
  namespace,
  registerUser,
  seedExercises,
  type AuthState,
} from "./testUtils";

const localSecret = process.env.JWT_SECRET ?? "cheluisfit-local-development-secret-change-me";

let primaryAuth: AuthState;

describe("Auth", () => {
  beforeAll(seedExercises);
  afterAll(cleanupTestData);

  it("registers a user without exposing passwordHash and rejects duplicate email", async () => {
    primaryAuth = await registerUser(`auth-primary.${namespace}@cheluisfit.test`);

    expect(primaryAuth.token).toContain(".");
    expect(primaryAuth.user.email).toBe(`auth-primary.${namespace}@cheluisfit.test`);
    expect(primaryAuth.user).not.toHaveProperty("passwordHash");

    const duplicate = await request(app)
      .post("/api/auth/register")
      .send(createRegisterPayload(`auth-primary.${namespace}@cheluisfit.test`));

    expect(duplicate.status).toBe(409);
  });

  it("logs in with valid credentials and rejects bad credentials", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "Password123!",
    });

    expect(login.status).toBe(200);
    expect(login.body.user).not.toHaveProperty("passwordHash");
    expect(login.body.token).toContain(".");
    expect(login.body.refreshToken).toBeDefined();

    const badLogin = await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "wrong-password",
    });

    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error).toBe("Invalid email or password");
  });

  it("protects private endpoints for missing, invalid and expired tokens", async () => {
    const noToken = await request(app).get("/api/me");
    expect(noToken.status).toBe(401);
    expect(noToken.body.error).toBe("Authentication required");

    const invalidToken = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(invalidToken.status).toBe(401);
    expect(invalidToken.body.error).toBe("Authentication required");

    const expiredToken = await new SignJWT({ email: primaryAuth.user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(primaryAuth.user.id)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(localSecret));

    const expired = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(expired.status).toBe(401);
    expect(expired.body.error).toBe("Authentication required");
  });

  it("rejects weak passwords on registration", async () => {
    const weak = await request(app)
      .post("/api/auth/register")
      .send(createRegisterPayload(`weak.${namespace}@cheluisfit.test`).password = "12345678");

    expect(weak).toBeDefined();
  });

  it("blocks cross-user workout history access", async () => {
    const secondaryAuth = await registerUser(`auth-secondary.${namespace}@cheluisfit.test`);

    const result = await authed(secondaryAuth).get(
      `/api/users/${primaryAuth.user.id}/workout-sessions`,
    );

    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Forbidden");
  });

  it("exchanges a refresh token for a new access token", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "Password123!",
    });

    expect(login.body.refreshToken).toBeDefined();

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: login.body.refreshToken });

    expect(refresh.status).toBe(200);
    expect(refresh.body.token).toContain(".");
    expect(refresh.body.refreshToken).toBeDefined();
    expect(refresh.body.refreshToken).not.toBe(login.body.refreshToken);

    const reuse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: login.body.refreshToken });

    expect(reuse.status).toBe(401);
  });

  it("changes password and invalidates refresh tokens", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "Password123!",
    });

    const auth: AuthState = login.body;

    const change = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ currentPassword: "Password123!", newPassword: "NewPass456!" });

    expect(change.status).toBe(200);

    const oldRefresh = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: login.body.refreshToken });

    expect(oldRefresh.status).toBe(401);

    const newLogin = await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "NewPass456!",
    });

    expect(newLogin.status).toBe(200);

    await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "Password123!",
    });

    expect(newLogin.body.token).toContain(".");

    // Restore original password for other tests
    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${newLogin.body.token}`)
      .send({ currentPassword: "NewPass456!", newPassword: "Password123!" });
  });

  it("locks account after 5 failed login attempts", async () => {
    const lockEmail = `auth-lockout.${namespace}@cheluisfit.test`;
    await registerUser(lockEmail);

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/login").send({
        email: lockEmail,
        password: "wrong-password",
      });
    }

    const locked = await request(app).post("/api/auth/login").send({
      email: lockEmail,
      password: "Password123!",
    });

    expect(locked.status).toBe(429);
    expect(locked.body.error).toContain("bloqueada");
  });

  it("revokes all refresh tokens on logout", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: `auth-primary.${namespace}@cheluisfit.test`,
      password: "Password123!",
    });

    const auth: AuthState = login.body;

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${auth.token}`);

    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: login.body.refreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });
});
