export const CHECK_IN_SMS_RETRY_DELAY_MS = 30_000;

export function checkInSmsRetryBefore(now = Date.now()): string {
  return new Date(now - CHECK_IN_SMS_RETRY_DELAY_MS).toISOString();
}

export function checkInSmsFailureSummary(error: unknown): string {
  if (!(error instanceof Error)) return "Unexpected SMS provider error.";
  const status = "status" in error && typeof error.status === "number"
    ? ` (HTTP ${error.status})`
    : "";
  return `${error.name || "Error"}${status}: ${error.message}`.slice(0, 500);
}
