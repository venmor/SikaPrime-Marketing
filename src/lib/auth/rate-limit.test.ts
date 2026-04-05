import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only to avoid errors in test environment
vi.mock("server-only", () => ({}));

// Mock next/headers
const mockGet = vi.fn();
vi.mock("next/headers", () => {
  return {
    headers: vi.fn().mockResolvedValue({
      get: (...args: unknown[]) => mockGet(...args),
    }),
  };
});

// Mock prisma to avoid DB connection issues
vi.mock("@/lib/db", () => ({
  prisma: {
    rateLimitBucket: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { buildRateLimitKey } from "./rate-limit";

describe("rate-limit IP fingerprinting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prioritizes x-real-ip over x-forwarded-for (prevents spoofing)", async () => {
    mockGet.mockImplementation((name: string) => {
      if (name === "x-real-ip") return "2.2.2.2";
      if (name === "x-forwarded-for") return "1.1.1.1, 2.2.2.2";
      if (name === "user-agent") return "test-agent";
      return null;
    });

    const key = await buildRateLimitKey("login");

    // 2.2.2.2 is the real IP from x-real-ip, even if 1.1.1.1 was spoofed in x-forwarded-for
    expect(key).toBe("login:2.2.2.2:test-agent");
  });

  it("prioritizes x-vercel-forwarded-for over x-forwarded-for", async () => {
    mockGet.mockImplementation((name: string) => {
      if (name === "x-vercel-forwarded-for") return "2.2.2.2";
      if (name === "x-forwarded-for") return "1.1.1.1, 2.2.2.2";
      if (name === "user-agent") return "test-agent";
      return null;
    });

    const key = await buildRateLimitKey("login");

    // 2.2.2.2 is the real IP from x-vercel-forwarded-for
    expect(key).toBe("login:2.2.2.2:test-agent");
  });

  it("falls back to the first IP in x-forwarded-for if secure headers are missing", async () => {
    mockGet.mockImplementation((name: string) => {
      if (name === "x-forwarded-for") return "1.1.1.1, 2.2.2.2";
      if (name === "user-agent") return "test-agent";
      return null;
    });

    const key = await buildRateLimitKey("login");

    expect(key).toBe("login:1.1.1.1:test-agent");
  });

  it("handles missing headers gracefully", async () => {
    mockGet.mockReturnValue(null);

    const key = await buildRateLimitKey("login");
    expect(key).toBe("login:unknown:unknown");
  });
});
