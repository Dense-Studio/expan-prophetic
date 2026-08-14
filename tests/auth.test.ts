import { beforeEach, describe, expect, it } from "vitest";
import { createAdminSessionCookie, hasAdminSession, verifyAdminPassword } from "../server/auth";

describe("admin session", () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "test-session-secret-that-is-longer-than-thirty-two-characters";
    process.env.ADMIN_PASSWORD = "correct-password";
    process.env.NODE_ENV = "test";
  });

  it("verifies the configured password without exposing it to the browser", () => {
    expect(verifyAdminPassword("correct-password")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
  });

  it("accepts a signed cookie and rejects a tampered cookie", () => {
    const cookie = createAdminSessionCookie().split(";")[0];
    expect(hasAdminSession({ headers: { cookie } } as never)).toBe(true);
    expect(hasAdminSession({ headers: { cookie: `${cookie}tampered` } } as never)).toBe(false);
  });
});
