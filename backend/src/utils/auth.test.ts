import { describe, expect, it } from "vitest";
import { signJwt, verifyJwt } from "./jwt";
import { hashPassword, verifyPassword } from "./password";

describe("password utilities", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Password123");

    expect(hash).not.toContain("Password123");
    await expect(verifyPassword("Password123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("jwt utilities", () => {
  it("signs and verifies a token", async () => {
    const token = await signJwt({ sub: "user-1", email: "user@example.com" });
    const payload = await verifyJwt(token);

    expect(payload?.sub).toBe("user-1");
    expect(payload?.email).toBe("user@example.com");
  });

  it("rejects malformed tokens", async () => {
    await expect(verifyJwt("not-a-real-token")).resolves.toBeNull();
  });
});
