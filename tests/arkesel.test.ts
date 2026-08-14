import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArkeselHttpError, sendArkeselBatch } from "../server/arkesel";

describe("Arkesel batch response handling", () => {
  beforeEach(() => {
    process.env.ARKESEL_API_KEY = "test-key";
    process.env.ARKESEL_SANDBOX = "true";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("captures accepted IDs and invalid recipients", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "success",
      data: [
        { recipient: "233241234567", id: "sms-1" },
        { "invalid numbers": ["233000000000"] },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendArkeselBatch(["233241234567", "233000000000"], "Test"))
      .resolves.toEqual({ accepted: [{ recipient: "233241234567", id: "sms-1" }], invalid: ["233000000000"] });
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.sandbox).toBe(true);
  });

  it("preserves provider HTTP status for retry policy decisions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("busy", { status: 500 })));
    const error = await sendArkeselBatch(["233241234567"], "Test").catch((value) => value);
    expect(error).toBeInstanceOf(ArkeselHttpError);
    expect(error.status).toBe(500);
  });
});
