import { describe, expect, it } from "vitest";
import {
  calculateBatchCount,
  isRetryableDeliveryStatus,
  mapProviderStatus,
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
});
