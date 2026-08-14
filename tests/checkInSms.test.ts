import { describe, expect, it } from "vitest";
import {
  CHECK_IN_SMS_RETRY_DELAY_MS,
  checkInSmsFailureSummary,
  checkInSmsRetryBefore,
} from "../server/checkInSms";

describe("check-in confirmation SMS retry policy", () => {
  it("opens a new retry claim after 30 seconds", () => {
    const now = Date.parse("2026-08-14T20:00:00.000Z");
    expect(CHECK_IN_SMS_RETRY_DELAY_MS).toBe(30_000);
    expect(checkInSmsRetryBefore(now)).toBe("2026-08-14T19:59:30.000Z");
  });

  it("stores a bounded provider diagnostic without credentials", () => {
    const error = Object.assign(new Error("Gateway rejected the message"), {
      name: "ArkeselHttpError",
      status: 422,
    });
    expect(checkInSmsFailureSummary(error)).toBe(
      "ArkeselHttpError (HTTP 422): Gateway rejected the message",
    );
    expect(checkInSmsFailureSummary("failure")).toBe("Unexpected SMS provider error.");
  });
});
