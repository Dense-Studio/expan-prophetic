import { describe, expect, it } from "vitest";
import { estimateSms, normalizeGhanaPhone, normalizeUniquePhones } from "../lib/smsEncoding";
import { REMINDER_TEMPLATES } from "../lib/smsTemplates";

describe("SMS encoding", () => {
  it("keeps both reminder templates inside one GSM-7 segment", () => {
    expect(estimateSms(REMINDER_TEMPLATES.morning.message)).toMatchObject({ encoding: "GSM-7", parts: 1 });
    expect(estimateSms(REMINDER_TEMPLATES.evening.message)).toMatchObject({ encoding: "GSM-7", parts: 1, units: 160 });
  });

  it("counts GSM extension characters as two septets", () => {
    expect(estimateSms("^")).toMatchObject({ encoding: "GSM-7", units: 2, parts: 1 });
  });

  it("switches to UCS-2 for non-GSM characters", () => {
    expect(estimateSms("Welcome 😊")).toMatchObject({ encoding: "UCS-2", parts: 1 });
    expect(estimateSms("é".repeat(161))).toMatchObject({ encoding: "GSM-7", parts: 2 });
    expect(estimateSms("●".repeat(71))).toMatchObject({ encoding: "UCS-2", parts: 2 });
  });
});

describe("Ghana phone normalization", () => {
  it.each([
    ["0241234567", "233241234567"],
    ["241234567", "233241234567"],
    ["+233 24 123 4567", "233241234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeGhanaPhone(input)).toBe(expected);
  });

  it("rejects malformed numbers and deduplicates after normalization", () => {
    expect(normalizeGhanaPhone("1234")).toBeNull();
    expect(normalizeUniquePhones(["0241234567", "+233241234567", "bad"])).toEqual({
      valid: ["233241234567"],
      invalid: ["bad"],
    });
  });
});
