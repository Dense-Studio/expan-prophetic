import { describe, expect, it } from "vitest";
import { matchOutreachLocationId, normalizeLocationName } from "../lib/locationTargeting";

describe("location targeting", () => {
  it("normalizes case, punctuation and whitespace", () => {
    expect(normalizeLocationName("  Shama-JCT. ")).toBe("shama junction");
  });

  it.each([
    ["Kojokrom", "kojokrom"],
    ["Kojokrom, Takoradi", "kojokrom"],
    ["Mpintsin", "mpinstin"],
    ["ESIPON", "esipon"],
    ["Inchaban - Shama", "inchaban"],
    ["Aboadze", "aboadze"],
    ["Shama Jct", "shama-junction"],
    ["Shama Junction", "shama-junction"],
    ["Shama", "shama"],
  ])("classifies %s as %s", (value, target) => {
    expect(matchOutreachLocationId(value)).toBe(target);
  });

  it("does not loosely match unrelated locations", () => {
    expect(matchOutreachLocationId("Takoradi")).toBeNull();
    expect(matchOutreachLocationId(null)).toBeNull();
  });
});

