import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSession } from "./session";
import { UserRole } from "@prisma/client";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("jose", async () => {
  const actual = (await vi.importActual("jose")) as any;
  return {
    ...actual,
    SignJWT: vi.fn().mockImplementation(() => ({
      setProtectedHeader: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("mocked-token"),
    })),
  };
});

describe("Session Auth (Security Fix)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("throws an error when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;

    const session = {
      userId: "123",
      email: "test@example.com",
      role: UserRole.ADMIN,
      name: "Test User",
    };

    await expect(createSession(session)).rejects.toThrow("AUTH_SECRET environment variable is not set");
  });

  it("succeeds when AUTH_SECRET is provided", async () => {
    process.env.AUTH_SECRET = "some-secure-secret";

    const session = {
      userId: "123",
      email: "test@example.com",
      role: UserRole.ADMIN,
      name: "Test User",
    };

    await expect(createSession(session)).resolves.not.toThrow();
  });
});
