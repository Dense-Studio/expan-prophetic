import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  calculateBatchCount,
  isRetryableDeliveryStatus,
  mapProviderStatus,
  parseDeliveryHistoryOptions,
  registrationMatchesArrivalWindow,
  SMS_BATCH_CONCURRENCY,
  SMS_BATCH_SIZE,
} from "../server/campaigns";

describe("campaign batching", () => {
  it("splits 3,000 recipients into twelve 250-recipient batches", () => {
    expect(SMS_BATCH_SIZE).toBe(250);
    expect(SMS_BATCH_CONCURRENCY).toBe(3);
    expect(calculateBatchCount(3000)).toBe(12);
    expect(calculateBatchCount(0)).toBe(0);
  });
});

describe("delivery status policy", () => {
  it.each([
    ["QUEUED", "accepted"],
    ["SUBMITTED", "accepted"],
    ["DELIVERED", "delivered"],
    ["NOT_DELIVERED", "not_delivered"],
    ["EXPIRED", "expired"],
    ["PROHIBITED", "prohibited"],
  ])("maps %s to %s", (provider, local) => {
    expect(mapProviderStatus(provider)).toBe(local);
  });

  it("allows manual retry only for known retryable delivery failures", () => {
    expect(isRetryableDeliveryStatus("not_delivered")).toBe(true);
    expect(isRetryableDeliveryStatus("expired")).toBe(true);
    expect(isRetryableDeliveryStatus("needs_review")).toBe(false);
    expect(isRetryableDeliveryStatus("prohibited")).toBe(false);
  });

  it("accepts a delivered-only history window for a generic broadcast", () => {
    expect(parseDeliveryHistoryOptions({
      kind: "general",
      deliveryHistoryEnabled: true,
      deliveryHistoryStatuses: ["delivered"],
      deliveryHistoryFrom: "2026-08-14T00:00:00Z",
      deliveryHistoryTo: "2026-08-15T00:00:00Z",
    })).toEqual({
      statuses: ["delivered"],
      from: "2026-08-14T00:00:00.000Z",
      to: "2026-08-15T00:00:00.000Z",
    });
  });

  it("rejects an empty or reversed history filter", () => {
    expect(() => parseDeliveryHistoryOptions({
      kind: "general",
      deliveryHistoryEnabled: true,
      deliveryHistoryStatuses: [],
      deliveryHistoryFrom: "2026-08-14T00:00:00Z",
      deliveryHistoryTo: "2026-08-15T00:00:00Z",
    })).toThrow("Select at least one");
    expect(() => parseDeliveryHistoryOptions({
      kind: "general",
      deliveryHistoryEnabled: true,
      deliveryHistoryStatuses: ["delivered"],
      deliveryHistoryFrom: "2026-08-15T00:00:00Z",
      deliveryHistoryTo: "2026-08-14T00:00:00Z",
    })).toThrow("date range is invalid");
  });
});

describe("auditorium priority", () => {
  const eventKey = "expan-all-night-2026-08-14";
  const cutoff = "2026-08-14T19:00:00.000Z";

  it("treats a new August registration at or after 7 PM as an arrival", () => {
    expect(registrationMatchesArrivalWindow({ event_key: eventKey, created_at: cutoff }, eventKey, cutoff)).toBe(true);
    expect(registrationMatchesArrivalWindow({ event_key: eventKey, created_at: "2026-08-14T19:15:00.000Z" }, eventKey, cutoff)).toBe(true);
  });

  it("does not prioritise test records before the cutoff or another edition", () => {
    expect(registrationMatchesArrivalWindow({ event_key: eventKey, created_at: "2026-08-14T18:59:59.999Z" }, eventKey, cutoff)).toBe(false);
    expect(registrationMatchesArrivalWindow({ event_key: "expan-all-night-2026-03-27", created_at: "2026-08-14T19:15:00.000Z" }, eventKey, cutoff)).toBe(false);
  });

  it("keeps lower tiers blocked while auditorium recipients are queued or submitting", () => {
    const migration = readFileSync(new URL("../supabase_sms_priority_migration.sql", import.meta.url), "utf8");
    expect(migration).toContain("MAX(priority_tier)");
    expect(migration).toContain("status IN ('queued', 'submitting')");
    expect(migration).toContain("recipient.priority_tier = active_tier.priority_tier");
    expect(migration).toContain("FOR UPDATE OF recipient SKIP LOCKED");
  });
});
